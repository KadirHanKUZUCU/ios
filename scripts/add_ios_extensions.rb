require 'xcodeproj'
require 'fileutils'

begin
  project_path = 'ios/SpamFilter.xcodeproj'
  unless File.exist?(project_path)
    puts "❌ Error: Project not found at #{project_path}"
    exit 1
  end

  puts "📂 Opening Xcode project: #{project_path}"
  project = Xcodeproj::Project.open(project_path)
  main_target = project.targets.find { |t| t.name == 'SpamFilter' }
  unless main_target
    puts "❌ Error: Main target 'SpamFilter' not found. Available targets: #{project.targets.map(&:name).join(', ')}"
    exit 1
  end

  # Embed App Extensions phase on main target
  embed_phase = main_target.copy_files_build_phases.find { |bp| bp.name == 'Embed App Extensions' || bp.dst_subfolder_spec.to_s == '13' }
  unless embed_phase
    puts "➕ Creating Embed App Extensions copy files build phase..."
    embed_phase = main_target.new_copy_files_build_phase('Embed App Extensions')
    embed_phase.dst_subfolder_spec = '13'
    embed_phase.dst_path = ''
  end

  def setup_extension(project, main_target, embed_phase, name, bundle_suffix, framework_name)
    puts "🔨 Setting up #{name}..."

    # Ensure extension files exist in ios/<name>/
    FileUtils.mkdir_p("ios/#{name}")
    if Dir.exist?(name)
      FileUtils.cp_r(Dir.glob("#{name}/*"), "ios/#{name}/")
    end
    if Dir.exist?("SpamFilter/Shared")
      FileUtils.cp_r(Dir.glob("SpamFilter/Shared/*"), "ios/#{name}/")
    end

    target = project.targets.find { |t| t.name == name }
    unless target
      target = project.new_target(:app_extension, name, :ios, '14.0')
      puts "   Target created."
    end

    # Group & Swift File References
    ext_group = project.main_group.find_subpath(name, true)
    ext_group.path = name
    ext_group.source_tree = '<group>'

    swift_files = Dir.glob("ios/#{name}/*.swift")
    puts "   Found #{swift_files.count} Swift files in ios/#{name}"

    file_refs = swift_files.map do |f|
      basename = File.basename(f)
      ext_group.find_file_by_path(basename) || ext_group.new_file(basename)
    end
    
    # Avoid duplicate references in sources build phase
    existing_file_refs = target.source_build_phase.files.map(&:file_ref)
    new_refs = file_refs.reject { |ref| existing_file_refs.include?(ref) }
    target.add_file_references(new_refs)

    # Framework
    if framework_name
      target.add_system_framework(framework_name)
      puts "   Framework #{framework_name} added."
    end

    # Build Settings
    target.build_configuration_list.set_setting('PRODUCT_NAME', name)
    target.build_configuration_list.set_setting('PRODUCT_BUNDLE_IDENTIFIER', "$(PRODUCT_BUNDLE_IDENTIFIER).#{bundle_suffix}")
    target.build_configuration_list.set_setting('INFOPLIST_FILE', "#{name}/Info.plist")
    target.build_configuration_list.set_setting('SWIFT_VERSION', '5.0')
    target.build_configuration_list.set_setting('IPHONEOS_DEPLOYMENT_TARGET', '14.0')
    target.build_configuration_list.set_setting('SKIP_INSTALL', 'YES')
    target.build_configuration_list.set_setting('TARGETED_DEVICE_FAMILY', '1')
    target.build_configuration_list.set_setting('CODE_SIGNING_ALLOWED', 'NO')
    target.build_configuration_list.set_setting('CODE_SIGNING_REQUIRED', 'NO')
    target.build_configuration_list.set_setting('CODE_SIGN_IDENTITY', '')
    target.build_configuration_list.set_setting('GENERATE_INFOPLIST_FILE', 'NO')
    target.build_configuration_list.set_setting('ENABLE_BITCODE', 'NO')
    target.build_configuration_list.set_setting('ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES', 'NO')

    # Embed in main target PlugIns
    already_embedded = embed_phase.files.any? { |bf| bf.file_ref == target.product_reference }
    unless already_embedded
      build_file = project.new(Xcodeproj::Project::Object::PBXBuildFile)
      build_file.file_ref = target.product_reference
      build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
      embed_phase.files << build_file
      puts "   Embedded in main target PlugIns."
    end

    # Add dependency
    main_target.add_dependency(target)
    puts "✅ #{name} successfully configured!"
  end

  setup_extension(project, main_target, embed_phase, 'MessageFilterExtension', 'MessageFilterExtension', 'IdentityLookup')
  setup_extension(project, main_target, embed_phase, 'CallDirectoryExtension', 'CallDirectoryExtension', 'CallKit')

  project.save
  puts "🎉 Project saved successfully with all App Extensions embedded!"
rescue => e
  puts "❌ Exception: #{e.class}: #{e.message}"
  puts e.backtrace
  exit 1
end

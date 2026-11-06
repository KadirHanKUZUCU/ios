require 'xcodeproj'
require 'fileutils'

project_path = 'ios/SpamFilter.xcodeproj'
unless File.exist?(project_path)
  puts "❌ Error: Project not found at #{project_path}"
  exit 1
end

project = Xcodeproj::Project.open(project_path)
main_target = project.targets.find { |t| t.name == 'SpamFilter' }
unless main_target
  puts "❌ Error: Main target 'SpamFilter' not found"
  exit 1
end

# Make sure Embed App Extensions phase exists
embed_phase = main_target.copy_files_build_phases.find { |p| p.name == 'Embed App Extensions' || p.dst_subfolder_spec == 13 }
unless embed_phase
  embed_phase = main_target.new_copy_files_build_phase('Embed App Extensions')
  embed_phase.dst_subfolder_spec = 13 # 13 corresponds to "PlugIns"
end

def configure_extension(project, main_target, embed_phase, name, bundle_suffix, framework_name)
  existing_target = project.targets.find { |t| t.name == name }
  if existing_target
    puts "ℹ️ Target #{name} already exists, skipping creation."
    return existing_target
  end

  puts "🔨 Creating extension target: #{name}..."
  target = project.new_target(:app_extension, name, :ios, '14.0')

  # Configure build settings
  target.build_configurations.each do |config|
    config.build_settings['PRODUCT_NAME'] = name
    config.build_settings['PRODUCT_BUNDLE_IDENTIFIER'] = "$(PRODUCT_BUNDLE_IDENTIFIER).#{bundle_suffix}"
    config.build_settings['INFOPLIST_FILE'] = "#{name}/Info.plist"
    config.build_settings['SWIFT_VERSION'] = '5.0'
    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '14.0'
    config.build_settings['SKIP_INSTALL'] = 'YES'
    config.build_settings['TARGETED_DEVICE_FAMILY'] = '1' # iPhone
    config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
    config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
    config.build_settings['CODE_SIGN_IDENTITY'] = ''
    config.build_settings['DEVELOPMENT_TEAM'] = ''
    config.build_settings['CURRENT_PROJECT_VERSION'] = '1'
    config.build_settings['MARKETING_VERSION'] = '1.0.0'
    config.build_settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  end

  # Create group in project navigator if not present
  group = project.main_group.find_subpath(name, true)

  # Add Swift files to compile sources
  sources_phase = target.source_build_phase
  files = Dir.glob("ios/#{name}/*.swift")
  files.each do |f|
    basename = File.basename(f)
    file_ref = group.find_file_by_path(basename) || group.new_file(basename)
    sources_phase.add_file_reference(file_ref, true)
  end

  # Add framework
  if framework_name
    target.add_system_framework(framework_name)
  end

  # Embed in main target PlugIns
  build_file = embed_phase.add_file_reference(target.product_reference)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

  # Add dependency so building main target automatically builds this extension
  main_target.add_dependency(target)

  puts "✅ Extension #{name} successfully configured and linked!"
  target
end

# 1. MessageFilterExtension (IdentityLookup)
configure_extension(project, main_target, embed_phase, 'MessageFilterExtension', 'MessageFilterExtension', 'IdentityLookup')

# 2. CallDirectoryExtension (CallKit)
configure_extension(project, main_target, embed_phase, 'CallDirectoryExtension', 'CallDirectoryExtension', 'CallKit')

project.save
puts "🎉 Successfully saved #{project_path} with all extensions linked to PlugIns!"


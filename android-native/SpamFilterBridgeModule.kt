package com.app.spamfilter

import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SpamFilterBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SpamFilterBridge"

    @ReactMethod
    fun saveRulesToSharedStorage(rulesJson: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("spam_filter_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("rules_json", rulesJson).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SAVE_ERROR", e.localizedMessage)
        }
    }

    @ReactMethod
    fun syncAndroidRules(rulesJson: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("spam_filter_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("rules_json", rulesJson).apply()
            promise.resolve(mapOf("message" to "Kurallar Android Çağrı ve SMS filtresine aktarıldı."))
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.localizedMessage)
        }
    }

    @ReactMethod
    fun isCallScreeningRoleHeld(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = reactContext.getSystemService(Context.ROLE_SERVICE) as? RoleManager
            val held = roleManager?.isRoleHeld(RoleManager.ROLE_CALL_SCREENING) ?: false
            promise.resolve(held)
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestCallScreeningRole(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roleManager = reactContext.getSystemService(Context.ROLE_SERVICE) as? RoleManager
            if (roleManager != null && !roleManager.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
                val intent = roleManager.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING)
                currentActivity?.startActivityForResult(intent, 9001)
                promise.resolve(true)
                return
            }
        }
        promise.resolve(false)
    }
}


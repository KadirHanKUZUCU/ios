package com.app.spamfilter

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import android.content.Context
import org.json.JSONObject

class SpamCallScreeningService : CallScreeningService() {

    override fun onScreenCall(callDetails: Call.Details) {
        val phoneNumber = callDetails.handle?.schemeSpecificPart ?: return
        val sanitized = sanitizeNumber(phoneNumber)

        val prefs = applicationContext.getSharedPreferences("spam_filter_prefs", Context.MODE_PRIVATE)
        val rulesJson = prefs.getString("rules_json", null)

        var shouldBlock = false

        if (rulesJson != null) {
            try {
                val json = JSONObject(rulesJson)

                // 1. Özel kara liste numaralarını kontrol et
                val customNumbers = json.optJSONArray("customBlockedNumbers")
                if (customNumbers != null) {
                    for (i in 0 until customNumbers.length()) {
                        val blocked = sanitizeNumber(customNumbers.getString(i))
                        if (sanitized == blocked) {
                            shouldBlock = true
                            break
                        }
                    }
                }

                // 2. Ön ek bloklarını kontrol et (örn: 90375, 90729, 90850)
                if (!shouldBlock) {
                    val prefixes = json.optJSONArray("blockedNumberPrefixes")
                    if (prefixes != null) {
                        for (i in 0 until prefixes.length()) {
                            val prefix = sanitizeNumber(prefixes.getString(i))
                            if (sanitized.startsWith(prefix)) {
                                shouldBlock = true
                                break
                            }
                        }
                    }
                }

            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        if (shouldBlock) {
            // Aramayı sessizce reddet ve engelle
            val response = CallResponse.Builder()
                .setDisallowCall(true)
                .setRejectCall(true)
                .setSkipNotification(true)
                .setSkipCallLog(false)
                .build()

            respondToCall(callDetails, response)
        } else {
            // Temiz arama, geçmesine izin ver
            val response = CallResponse.Builder().build()
            respondToCall(callDetails, response)
        }
    }

    private fun sanitizeNumber(input: String): String {
        var cleaned = input.replace(Regex("[^0-9]"), "")
        if (cleaned.startsWith("0")) {
            cleaned = "9$cleaned"
        }
        return cleaned
    }
}


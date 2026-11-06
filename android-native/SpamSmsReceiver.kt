package com.app.spamfilter

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject

class SpamSmsReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            for (sms in messages) {
                val sender = sms.displayOriginatingAddress ?: ""
                val messageBody = sms.displayMessageBody ?: ""

                val isSpam = evaluateSpam(context, sender, messageBody)
                if (isSpam) {
                    showSpamNotification(context, sender, messageBody)
                }
            }
        }
    }

    private fun evaluateSpam(context: Context, sender: String, body: String): Boolean {
        val prefs = context.getSharedPreferences("spam_filter_prefs", Context.MODE_PRIVATE)
        val rulesJson = prefs.getString("rules_json", null) ?: return false

        try {
            val json = JSONObject(rulesJson)
            val lowerBody = body.lowercase()
            val normalized = normalizeText(body)

            // 1. Whitelist Kontrolü
            val whitelist = json.optJSONArray("whitelistKeywords")
            if (whitelist != null) {
                for (i in 0 until whitelist.length()) {
                    val word = whitelist.getString(i).lowercase()
                    if (lowerBody.contains(word) || normalized.contains(word)) {
                        return false // Güvenli mesaj
                    }
                }
            }

            // 2. Kara Liste Kelimeler
            val blacklist = json.optJSONArray("blacklistKeywords")
            if (blacklist != null) {
                for (i in 0 until blacklist.length()) {
                    val word = blacklist.getString(i).lowercase()
                    if (lowerBody.contains(word) || normalized.contains(word)) {
                        return true
                    }
                }
            }

            // 3. Regex ve Kısa Linkler
            val regexes = json.optJSONArray("regexPatterns")
            if (regexes != null) {
                for (i in 0 until regexes.length()) {
                    val pattern = regexes.getString(i)
                    if (Regex(pattern, RegexOption.IGNORE_CASE).containsMatchIn(body) ||
                        Regex(pattern, RegexOption.IGNORE_CASE).containsMatchIn(normalized)) {
                        return true
                    }
                }
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }

        return false
    }

    private fun normalizeText(text: String): String {
        var res = text.lowercase()
        val diacritics = mapOf('ç' to 'c', 'ğ' to 'g', 'ı' to 'i', 'ö' to 'o', 'ş' to 's', 'ü' to 'u')
        res = res.map { diacritics[it] ?: it }.joinToString("")
        val leet = mapOf('0' to 'o', '1' to 'i', '3' to 'e', '4' to 'a', '5' to 's', '7' to 't', '8' to 'b')
        res = res.map { leet[it] ?: it }.joinToString("")
        return res.replace(Regex("[ \t\r\n\\-\\._]"), "")
    }

    private fun showSpamNotification(context: Context, sender: String, body: String) {
        val channelId = "spam_filter_alerts"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "İstenmeyen SMS Uyarıları", NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.stat_notify_error)
            .setContentTitle("🚫 İstenmeyen SMS Tespit Edildi")
            .setContentText("Gönderen: $sender")
            .setStyle(NotificationCompat.BigTextStyle().bigText("Gönderen: $sender\nMesaj: $body"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        notificationManager.notify(System.currentTimeMillis().toInt(), builder.build())
    }
}


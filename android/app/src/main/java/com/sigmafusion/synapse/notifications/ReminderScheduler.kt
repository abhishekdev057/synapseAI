package com.sigmafusion.synapse.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.sigmafusion.synapse.SynapseApp
import com.sigmafusion.synapse.core.TimeUtils
import com.sigmafusion.synapse.domain.ReminderStatus
import kotlinx.coroutines.flow.first
import kotlin.math.absoluteValue

/**
 * Schedules local alarms for the remaining pending reminders today. Alarms are
 * device-local (no server push) so they fire with the radio off.
 */
object ReminderScheduler {

    const val EXTRA_TITLE = "title"
    const val EXTRA_BODY = "body"
    const val EXTRA_REMINDER_ID = "reminderId"

    suspend fun rescheduleToday(context: Context) {
        val app = context.applicationContext as SynapseApp
        val occurrences = runCatching {
            app.container.repository.todayReminders.first()
        }.getOrElse { return }

        val am = context.getSystemService(AlarmManager::class.java) ?: return
        val now = TimeUtils.now()

        occurrences
            .filter { it.status == ReminderStatus.PENDING && it.scheduledForEpoch > now }
            .forEach { occ ->
                val requestCode = (occ.reminderId + occ.timeLabel).hashCode().absoluteValue
                val intent = Intent(context, ReminderReceiver::class.java).apply {
                    putExtra(EXTRA_TITLE, occ.title)
                    putExtra(EXTRA_BODY, occ.description ?: "It is time.")
                    putExtra(EXTRA_REMINDER_ID, occ.reminderId)
                }
                val pi = PendingIntent.getBroadcast(
                    context, requestCode, intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                val canExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    am.canScheduleExactAlarms()
                } else {
                    true
                }
                if (canExact) {
                    am.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, occ.scheduledForEpoch, pi,
                    )
                } else {
                    am.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, occ.scheduledForEpoch, pi,
                    )
                }
            }
    }
}

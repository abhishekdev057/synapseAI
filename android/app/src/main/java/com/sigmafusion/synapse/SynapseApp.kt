package com.sigmafusion.synapse

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import com.sigmafusion.synapse.data.sync.SyncScheduler
import com.sigmafusion.synapse.di.AppContainer
import com.sigmafusion.synapse.notifications.ReminderScheduler
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class SynapseApp : Application() {

    lateinit var container: AppContainer
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)

        createReminderChannel()
        SyncScheduler.ensurePeriodic(this)

        appScope.launch {
            // First run: pick the patient from the server, or fall back to a
            // bundled sample so the app is never blank offline.
            container.repository.sync()
            container.repository.seedLocalSampleIfEmpty()
            ReminderScheduler.rescheduleToday(this@SynapseApp)
        }
    }

    private fun createReminderChannel() {
        val channel = NotificationChannel(
            REMINDER_CHANNEL,
            "Reminders",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Medicine, hydration, activity and appointment reminders"
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        const val REMINDER_CHANNEL = "reminders"
    }
}

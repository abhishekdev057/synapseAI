package com.sigmafusion.synapse.data.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sigmafusion.synapse.SynapseApp

/**
 * Runs a full delta sync. Enqueued periodically, on connectivity, and
 * immediately after any local write.
 */
class SyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val repo = (applicationContext as SynapseApp).container.repository
        return repo.sync().fold(
            onSuccess = { Result.success() },
            onFailure = { if (runAttemptCount < 3) Result.retry() else Result.success() },
        )
    }
}

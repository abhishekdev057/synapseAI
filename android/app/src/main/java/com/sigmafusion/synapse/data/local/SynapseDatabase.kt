package com.sigmafusion.synapse.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        PatientEntity::class,
        ReminderEntity::class,
        ReminderLogEntity::class,
        GameSessionEntity::class,
        FamilyContactEntity::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class SynapseDatabase : RoomDatabase() {
    abstract fun patientDao(): PatientDao
    abstract fun reminderDao(): ReminderDao
    abstract fun reminderLogDao(): ReminderLogDao
    abstract fun gameSessionDao(): GameSessionDao
    abstract fun contactDao(): ContactDao

    companion object {
        fun build(context: Context): SynapseDatabase =
            Room.databaseBuilder(
                context.applicationContext,
                SynapseDatabase::class.java,
                "synapse.db",
            ).fallbackToDestructiveMigration().build()
    }
}

package com.sigmafusion.synapse.core

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

object TimeUtils {
    private val zone: ZoneId get() = ZoneId.systemDefault()
    private val inIndia = Locale("en", "IN")

    fun now(): Long = System.currentTimeMillis()

    fun todayStartEpoch(): Long =
        LocalDate.now(zone).atStartOfDay(zone).toInstant().toEpochMilli()

    /** Today's DOW as 0=Sunday … 6=Saturday to match the web app. */
    fun todayDowSundayZero(): Int = LocalDate.now(zone).dayOfWeek.value % 7

    fun atTimeTodayEpoch(hhmm: String): Long {
        val parts = hhmm.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return LocalDate.now(zone)
            .atTime(LocalTime.of(h, m))
            .atZone(zone)
            .toInstant()
            .toEpochMilli()
    }

    fun parseIso(value: String): Long =
        runCatching { Instant.parse(value).toEpochMilli() }
            .getOrElse { runCatching { java.time.OffsetDateTime.parse(value).toInstant().toEpochMilli() }.getOrDefault(now()) }

    fun epochToIso(epoch: Long): String = Instant.ofEpochMilli(epoch).toString()

    fun formatClockTime(epoch: Long): String =
        Instant.ofEpochMilli(epoch).atZone(zone)
            .format(DateTimeFormatter.ofPattern("h:mm a", inIndia))

    fun formatClockTime(hhmm: String): String = formatClockTime(atTimeTodayEpoch(hhmm))

    fun formatBigClock(epoch: Long): String =
        Instant.ofEpochMilli(epoch).atZone(zone)
            .format(DateTimeFormatter.ofPattern("h:mm", inIndia))

    fun formatAmPm(epoch: Long): String =
        Instant.ofEpochMilli(epoch).atZone(zone)
            .format(DateTimeFormatter.ofPattern("a", inIndia))

    fun formatDayDate(epoch: Long = now()): String =
        Instant.ofEpochMilli(epoch).atZone(zone)
            .format(DateTimeFormatter.ofPattern("EEEE, d MMMM", inIndia))

    fun formatShortDate(epoch: Long): String =
        Instant.ofEpochMilli(epoch).atZone(zone)
            .format(DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM).withLocale(inIndia))

    fun partOfDay(epoch: Long = now()): String {
        val hour = Instant.ofEpochMilli(epoch).atZone(zone).hour
        return when {
            hour < 12 -> "morning"
            hour < 17 -> "afternoon"
            else -> "evening"
        }
    }
}

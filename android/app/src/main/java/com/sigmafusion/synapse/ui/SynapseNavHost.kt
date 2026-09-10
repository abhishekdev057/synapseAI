package com.sigmafusion.synapse.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.sigmafusion.synapse.SynapseApp
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.i18n.stringsFor
import com.sigmafusion.synapse.ui.screens.games.GamesScreen
import com.sigmafusion.synapse.ui.screens.games.MemoryLaneScreen
import com.sigmafusion.synapse.ui.screens.home.HomeScreen
import com.sigmafusion.synapse.ui.screens.people.PeopleScreen
import com.sigmafusion.synapse.ui.screens.reminders.RemindersScreen
import com.sigmafusion.synapse.ui.screens.settings.SettingsScreen

object Routes {
    const val HOME = "home"
    const val GAMES = "games"
    const val MEMORY_LANE = "memory_lane"
    const val REMINDERS = "reminders"
    const val PEOPLE = "people"
    const val SETTINGS = "settings"
}

@Composable
fun rememberRepository(): SynapseRepository {
    val context = LocalContext.current
    return (context.applicationContext as SynapseApp).container.repository
}

@Composable
fun SynapseNavHost(startRoute: String?) {
    val nav = rememberNavController()
    val repo = rememberRepository()
    val langCode by repo.languageCode.collectAsStateWithLifecycle(initialValue = "en")
    val start = when (startRoute) {
        Routes.REMINDERS -> Routes.REMINDERS
        else -> Routes.HOME
    }

    CompositionLocalProvider(LocalStrings provides stringsFor(langCode)) {
        val t = LocalStrings.current
        NavHost(navController = nav, startDestination = start) {
            composable(Routes.HOME) {
                HomeScreen(
                    onOpenGames = { nav.navigate(Routes.GAMES) },
                    onOpenReminders = { nav.navigate(Routes.REMINDERS) },
                    onOpenPeople = { nav.navigate(Routes.PEOPLE) },
                    onOpenSettings = { nav.navigate(Routes.SETTINGS) },
                )
            }
            composable(Routes.GAMES) {
                AppScaffold(t.playAGame, onBack = { nav.popBackStack() }, onHome = { nav.popToHome() }) {
                    GamesScreen(onPlayMemoryLane = { nav.navigate(Routes.MEMORY_LANE) })
                }
            }
            composable(Routes.MEMORY_LANE) {
                AppScaffold(t.gameMemoryLane, onBack = { nav.popBackStack() }, onHome = { nav.popToHome() }) {
                    MemoryLaneScreen(onDone = { nav.popBackStack() })
                }
            }
            composable(Routes.REMINDERS) {
                AppScaffold(t.todaysReminders, onBack = { nav.popBackStack() }, onHome = { nav.popToHome() }) {
                    RemindersScreen()
                }
            }
            composable(Routes.PEOPLE) {
                AppScaffold(t.whoIsThis, onBack = { nav.popBackStack() }, onHome = { nav.popToHome() }) {
                    PeopleScreen()
                }
            }
            composable(Routes.SETTINGS) {
                AppScaffold(t.settings, onBack = { nav.popBackStack() }, onHome = { nav.popToHome() }) {
                    SettingsScreen()
                }
            }
        }
    }
}

private fun androidx.navigation.NavController.popToHome() {
    popBackStack(Routes.HOME, inclusive = false)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppScaffold(
    title: String,
    onBack: () -> Unit,
    onHome: () -> Unit,
    content: @Composable () -> Unit,
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text(title, style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", Modifier.padding(2.dp))
                    }
                },
                actions = {
                    IconButton(onClick = onHome) {
                        Icon(Icons.Default.Home, "Home")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                ),
            )
        },
    ) { inner ->
        Box(Modifier.fillMaxSize().padding(inner)) { content() }
    }
}

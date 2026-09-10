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
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.sigmafusion.synapse.SynapseApp
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.i18n.stringsFor
import com.sigmafusion.synapse.ui.screens.games.BirdAndBeastScreen
import com.sigmafusion.synapse.ui.screens.games.GamesScreen
import com.sigmafusion.synapse.ui.screens.games.MarketBasketScreen
import com.sigmafusion.synapse.ui.screens.games.MemoryLaneScreen
import com.sigmafusion.synapse.ui.screens.games.MorningRoutineScreen
import com.sigmafusion.synapse.ui.screens.games.PatternOfLoomScreen
import com.sigmafusion.synapse.ui.screens.games.SongOfHillsScreen
import com.sigmafusion.synapse.ui.screens.games.WordGardenScreen
import com.sigmafusion.synapse.ui.i18n.Strings
import com.sigmafusion.synapse.ui.i18n.gameTitle
import com.sigmafusion.synapse.ui.screens.home.HomeScreen
import com.sigmafusion.synapse.ui.screens.people.PeopleScreen
import com.sigmafusion.synapse.ui.screens.reminders.RemindersScreen
import com.sigmafusion.synapse.ui.screens.settings.SettingsScreen

object Routes {
    const val HOME = "home"
    const val GAMES = "games"
    const val REMINDERS = "reminders"
    const val PEOPLE = "people"
    const val SETTINGS = "settings"

    // Game routes — the string is exactly the catalogue key so the games list
    // can navigate with `nav.navigate(game.key)`.
    const val MEMORY_LANE = "memory_lane"
    const val MARKET_BASKET = "market_basket"
    const val MORNING_ROUTINE = "morning_routine"
    const val PATTERN_OF_THE_LOOM = "pattern_of_the_loom"
    const val BIRD_AND_BEAST = "bird_and_beast"
    const val SONG_OF_THE_HILLS = "song_of_the_hills"
    const val WORD_GARDEN = "word_garden"
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
                    GamesScreen(onPlay = { key -> nav.navigate(key) })
                }
            }
            gameDestination(Routes.MEMORY_LANE, nav, t) { MemoryLaneScreen(onDone = it) }
            gameDestination(Routes.MARKET_BASKET, nav, t) { MarketBasketScreen(onDone = it) }
            gameDestination(Routes.MORNING_ROUTINE, nav, t) { MorningRoutineScreen(onDone = it) }
            gameDestination(Routes.PATTERN_OF_THE_LOOM, nav, t) { PatternOfLoomScreen(onDone = it) }
            gameDestination(Routes.BIRD_AND_BEAST, nav, t) { BirdAndBeastScreen(onDone = it) }
            gameDestination(Routes.SONG_OF_THE_HILLS, nav, t) { SongOfHillsScreen(onDone = it) }
            gameDestination(Routes.WORD_GARDEN, nav, t) { WordGardenScreen(onDone = it) }
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

/** Registers one game screen wrapped in the standard app bar. */
private fun NavGraphBuilder.gameDestination(
    route: String,
    nav: NavHostController,
    t: Strings,
    screen: @Composable (onDone: () -> Unit) -> Unit,
) {
    composable(route) {
        AppScaffold(
            title = t.gameTitle(route),
            onBack = { nav.popBackStack() },
            onHome = { nav.popToHome() },
        ) {
            screen { nav.popBackStack() }
        }
    }
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

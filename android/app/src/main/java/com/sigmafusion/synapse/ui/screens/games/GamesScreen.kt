package com.sigmafusion.synapse.ui.screens.games

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sigmafusion.synapse.domain.GAME_CATALOG
import com.sigmafusion.synapse.domain.GameInfo
import com.sigmafusion.synapse.ui.components.ScreenColumn
import com.sigmafusion.synapse.ui.i18n.LocalStrings
import com.sigmafusion.synapse.ui.i18n.gameTitle
import com.sigmafusion.synapse.ui.theme.Dimens

@Composable
fun GamesScreen(onPlay: (String) -> Unit) {
    val t = LocalStrings.current
    ScreenColumn {
        GAME_CATALOG.forEach { game ->
            GameRow(
                game = game,
                title = t.gameTitle(game.key),
                lockedLabel = t.locked,
                onClick = { if (game.playable) onPlay(game.key) },
            )
        }
        Text(
            t.pickAnyGame,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
    }
}

@Composable
private fun GameRow(
    game: GameInfo,
    title: String,
    lockedLabel: String,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        enabled = game.playable,
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = if (game.playable) {
            MaterialTheme.colorScheme.surface
        } else {
            MaterialTheme.colorScheme.surfaceVariant
        },
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (game.playable) MaterialTheme.colorScheme.primary
            else MaterialTheme.colorScheme.outline,
        ),
    ) {
        Row(
            Modifier
                .padding(Dimens.cardPadding)
                .alpha(if (game.playable) 1f else 0.7f),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(game.emoji, fontSize = 34.sp)
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge)
                Text(
                    game.culturalTheme,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (!game.playable) {
                Spacer(Modifier.width(12.dp))
                Icon(
                    Icons.Default.Lock,
                    contentDescription = lockedLabel,
                    modifier = Modifier.size(Dimens.iconSmall),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

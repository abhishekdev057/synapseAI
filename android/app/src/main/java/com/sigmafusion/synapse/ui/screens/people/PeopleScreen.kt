package com.sigmafusion.synapse.ui.screens.people

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.domain.FamilyMember
import com.sigmafusion.synapse.ui.components.EmptyBlock
import com.sigmafusion.synapse.ui.screens.synapseViewModel
import com.sigmafusion.synapse.ui.theme.Dimens
import com.sigmafusion.synapse.ui.voice.SpeakButton
import com.sigmafusion.synapse.ui.voice.rememberSpeaker
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

data class PeopleUi(
    val members: List<FamilyMember> = emptyList(),
    val speechTag: String = "en-IN",
    val loading: Boolean = true,
)

class PeopleViewModel(repo: SynapseRepository) : ViewModel() {
    val state: StateFlow<PeopleUi> =
        combine(repo.contacts, repo.languageTag) { list, tag ->
            PeopleUi(list, tag, loading = false)
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), PeopleUi())
}

@Composable
fun PeopleScreen() {
    val vm: PeopleViewModel = synapseViewModel { PeopleViewModel(it) }
    val s by vm.state.collectAsStateWithLifecycle()
    val speaker = rememberSpeaker(s.speechTag)

    if (!s.loading && s.members.isEmpty()) {
        EmptyBlock("No family added yet. A caregiver can add them from the family dashboard.")
        return
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(Dimens.screenPadding),
        horizontalArrangement = Arrangement.spacedBy(Dimens.gap),
        verticalArrangement = Arrangement.spacedBy(Dimens.gap),
    ) {
        items(s.members, key = { it.id }) { member ->
            MemberCard(member, speaker)
        }
    }
}

@Composable
private fun MemberCard(
    member: FamilyMember,
    speaker: com.sigmafusion.synapse.ui.voice.Speaker,
) {
    val line = "This is ${member.name}, your ${member.relationship}. ${member.notes ?: ""}"
    Surface(
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            Modifier.padding(Dimens.cardPadding),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Box(
                Modifier
                    .size(96.dp)
                    .clip(CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                if (member.photoUrl != null) {
                    AsyncImage(
                        model = member.photoUrl,
                        contentDescription = member.name,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.size(96.dp).clip(CircleShape),
                    )
                } else {
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.size(96.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                member.name.take(1),
                                fontSize = 40.sp,
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                            )
                        }
                    }
                }
            }
            Text(
                member.name,
                style = MaterialTheme.typography.titleLarge,
                textAlign = TextAlign.Center,
            )
            Text(
                member.relationship,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            if (!member.notes.isNullOrBlank()) {
                Text(
                    member.notes,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
            SpeakButton(text = line, speaker = speaker, label = "Hear")
        }
    }
}

package com.sigmafusion.synapse.ui.screens

import androidx.compose.runtime.Composable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.sigmafusion.synapse.data.SynapseRepository
import com.sigmafusion.synapse.ui.rememberRepository

/** Creates a [ViewModel] wired to the app's single repository. */
@Composable
inline fun <reified VM : ViewModel> synapseViewModel(
    crossinline create: (SynapseRepository) -> VM,
): VM {
    val repo = rememberRepository()
    return viewModel(factory = viewModelFactory { initializer { create(repo) } })
}

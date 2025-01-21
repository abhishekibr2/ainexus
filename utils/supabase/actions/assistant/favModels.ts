'use server'

import { createClient } from '../../client';

export async function addToFavorites(userId: string, modelId: string) {
    try {
        const supabase = await createClient();

        // First get the current fav_models array
        const { data: userData, error: fetchError } = await supabase
            .from('user')
            .select('fav_models')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        // Create new fav_models array with the new model id
        const currentFavs = userData?.fav_models || [];
        if (!currentFavs.includes(modelId)) {
            const newFavs = [...currentFavs, modelId];

            // Update the user's fav_models
            const { error: updateError } = await supabase
                .from('user')
                .update({ fav_models: newFavs })
                .eq('id', userId);

            if (updateError) throw updateError;
            return { success: true, message: 'Added to favorites' };
        }
        return { success: false, message: 'Already in favorites' };
    } catch (error: any) {
        console.error('Error adding to favorites:', error);
        return { success: false, message: error.message };
    }
}

export async function removeFromFavorites(userId: string, modelId: string) {
    try {
        const supabase = await createClient();

        // First get the current fav_models array
        const { data: userData, error: fetchError } = await supabase
            .from('user')
            .select('fav_models')
            .eq('id', userId)
            .single();

        if (fetchError) throw fetchError;

        // Remove the model id from the array
        const currentFavs = userData?.fav_models || [];
        const newFavs = currentFavs.filter((id: string) => id !== modelId);

        // Update the user's fav_models
        const { error: updateError } = await supabase
            .from('user')
            .update({ fav_models: newFavs })
            .eq('id', userId);

        if (updateError) throw updateError;
        return { success: true, message: 'Removed from favorites' };
    } catch (error: any) {
        console.error('Error removing from favorites:', error);
        return { success: false, message: error.message };
    }
}

export async function checkIsFavorite(userId: string, modelId: string) {
    try {
        const supabase = await createClient();

        const { data: userData, error } = await supabase
            .from('user')
            .select('fav_models')
            .eq('id', userId)
            .single();

        if (error) throw error;

        const favModels = userData?.fav_models || [];
        return favModels.includes(modelId);
    } catch (error: any) {
        console.error('Error checking favorite status:', error);
        return false;
    }
}

<script lang="ts">
    import { userProfile } from '$stores/session';
</script>

{#if $userProfile}
    <div class="flex flex-row items-center gap-4 p-6">
        <img src={$userProfile.image} class="m-0 h-20 w-20 rounded-full" alt="profilepic" />
        <div>
            <h2 class="mb-2 mt-0 flex flex-row items-center gap-2">
                {$userProfile.name}
            </h2>
            <span>{$userProfile.about}</span>
        </div>
    </div>
{/if}

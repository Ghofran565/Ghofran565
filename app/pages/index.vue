<!--- app/pages/index.vue --->
<template>
	<div class="screen-center">
		<div
			class="flex flex-col sm:flex-row items-start justify-center gap-4 w-full max-w-7xl px-4 py-8"
		>
			<!-- GitHub Widget -->
			<GithubCard />
			
			<!-- Discord Widget -->
			<DiscordCard />
			
		</div>
	</div>
</template>

<style scoped>
		.screen-center {
		display: flex;
		justify-content: center; /* centers horizontally */
		align-items: center; /* centers vertically */
		height: 100vh; /* full viewport height */
		width: 100vw; /* full viewport width */
	}
</style>


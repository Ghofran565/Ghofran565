<!--- app/error.vue --->
<script setup lang="ts">
	import type { NuxtError } from '#app';

	const props = defineProps<{
		error: NuxtError;
	}>();
</script>

<template>
	<UApp>
		<UError
			redirect="/"
			:error="{
				statusCode: 404,
				statusMessage: 'Page not found',
				message: 'The page you are looking for does not exist.',
			}"
		/>
	</UApp>
</template>

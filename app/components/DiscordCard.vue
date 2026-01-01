<script setup lang="ts">
	interface DiscordActivity {
		id: string;
		name: string;
		type: number;
		state?: string;
		details?: string;
		timestamps?: { start?: number; end?: number };
		assets?: {
			large_image?: string;
			large_text?: string;
			small_image?: string;
			small_text?: string;
		};
		created_at?: number;
		platform?: string;
		sync_id?: string;
		party?: { id: string };
		application_id?: string;
		emoji?: {
			name?: string;
			id?: string;
			animated?: boolean;
		};
	}
	interface SpotifyData {
		song: string;
		artist: string;
		album: string;
		album_art_url: string;
		timestamps: { start: number; end: number };
		track_id: string;
	}
	interface DiscordData {
		discord_user: {
			id: string;
			username: string;
			global_name: string;
			display_name: string;
			avatar: string;
		};
		activities: DiscordActivity[];
		discord_status: 'online' | 'dnd' | 'idle' | 'offline';
		active_on_discord_web: boolean;
		active_on_discord_desktop: boolean;
		active_on_discord_mobile: boolean;
		active_on_discord_embedded: boolean;
		listening_to_spotify: boolean;
		spotify: SpotifyData | null;
	}

	const discordData = ref<{ data: DiscordData; success: boolean }>({
		data: {
			discord_user: {
				id: '',
				username: '',
				global_name: '',
				display_name: '',
				avatar: '',
			},
			activities: [],
			discord_status: 'offline',
			active_on_discord_web: false,
			active_on_discord_desktop: false,
			active_on_discord_mobile: false,
			active_on_discord_embedded: false,
			listening_to_spotify: false,
			spotify: null,
		},
		success: false,
	});

	// برای ذخیره تایم‌استمپ‌های آخرین دریافتی از API
	const localTimestamps = reactive({
		activities: {} as Record<string, { start?: number; end?: number }>,
		spotify: { start: 0, end: 0 },
	});

	const discordError = ref<any>(null);
	const isInitialLoading = ref(true); // فقط برای لود اولیه

	const fetchDiscordData = async () => {
		console.log('Fetch: Discord');
		// فقط در لود اولیه isInitialLoading رو true نگه دار، در رفرش‌ها نه
		if (!discordData.value.success) {
			isInitialLoading.value = true;
		}

		try {
			const response = await $fetch<{ data: DiscordData; success: boolean }>(
				'https://api.lanyard.rest/v1/users/1298823045959647254',
				{
					method: 'GET',
				}
			);

			discordData.value = response;
			discordError.value = null;

			// ذخیره تایم‌استمپ‌ها
			response.data.activities.forEach((act) => {
				if (act.id && act.timestamps) {
					localTimestamps.activities[act.id] = { ...act.timestamps };
				}
			});

			if (response.data.spotify?.timestamps) {
				localTimestamps.spotify = { ...response.data.spotify.timestamps };
			}
		} catch (err) {
			discordError.value = err;
		} finally {
			isInitialLoading.value = false;
		}
	};

	onMounted(() => {
		if (process.client) {
			fetchDiscordData(); // Initial fetch
			const interval = setInterval(fetchDiscordData, 7000); 
			onUnmounted(() => clearInterval(interval));
		}
	});

	// بقیه کدهای computed همانند قبل...
	const statusConfig = computed(() => {
		switch (discordData.value?.data.discord_status) {
			case 'online':
				return {
					icon: 'i-lucide-power',
					color: 'text-green-500',
					text: 'Online',
				};
			case 'dnd':
				return {
					icon: 'i-lucide-octagon-alert',
					color: 'text-red-500',
					text: 'Do Not Disturb',
				};
			case 'idle':
				return {
					icon: 'i-lucide-bed',
					color: 'text-yellow-500',
					text: 'Away',
				};
			default:
				return {
					icon: 'i-lucide-power-off',
					color: 'text-gray-500',
					text: 'Offline',
				};
		}
	});

	const devices = computed(() => {
		const devicesList = [];
		if (discordData.value?.data.active_on_discord_desktop)
			devicesList.push({ name: 'Desktop', icon: 'i-lucide-monitor' });
		if (discordData.value?.data.active_on_discord_mobile)
			devicesList.push({ name: 'Mobile', icon: 'i-lucide-smartphone' });
		if (discordData.value?.data.active_on_discord_web)
			devicesList.push({ name: 'Web', icon: 'i-lucide-globe' });
		if (discordData.value?.data.active_on_discord_embedded)
			devicesList.push({ name: 'Embedded', icon: 'i-lucide-gamepad' });
		return devicesList;
	});

	const customStatus = computed(() => {
		return (
			discordData.value?.data.activities.find(
				(act) => act.name === 'Custom Status'
			) || null
		);
	});

	const primaryActivity = computed(() => {
		return (
			discordData.value?.data.activities.find(
				(act) => act.name !== 'Spotify' && act.name !== 'Custom Status'
			) || null
		);
	});

	const otherActivities = computed(() => {
		return (
			discordData.value?.data.activities.filter(
				(act) =>
					act.name !== 'Spotify' &&
					act.name !== 'Custom Status' &&
					act !== primaryActivity.value
			) || []
		);
	});

	const customStatusEmoji = computed(() => {
		const emoji = customStatus.value?.emoji;
		if (!emoji) return null;

		if (emoji.name && !emoji.id) {
			return {
				type: 'unicode',
				value: emoji.name,
			};
		}

		if (emoji.id) {
			return {
				type: 'custom',
				value: `https://cdn.discordapp.com/emojis/${emoji.id}.${
					emoji.animated ? 'gif' : 'png'
				}?size=32`,
			};
		}

		return null;
	});

	const formatTime = (ms: number) => {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const spotifyProgress = computed(() => {
		const spotify = discordData.value?.data.spotify;
		if (
			!spotify ||
			!localTimestamps.spotify.start ||
			!localTimestamps.spotify.end
		)
			return null;

		const now = Date.now();
		const start = localTimestamps.spotify.start;
		const end = localTimestamps.spotify.end;

		const progress = Math.min(Math.max(now - start, 0), end - start);

		return {
			progress,
			duration: end - start,
			currentTime: formatTime(progress),
			endTime: formatTime(end - start),
			percentage: (progress / (end - start)) * 100,
		};
	});

	const hasAnyActivity = computed(() => {
		return discordData.value.data.activities.some(
			(a) => a.name !== 'Custom Status'
		);
	});

	const activityElapsed = (activity: DiscordActivity) => {
		const timestamps = activity.id
			? localTimestamps.activities[activity.id]
			: activity.timestamps;

		if (!timestamps?.start) return '';

		const elapsed = Date.now() - timestamps.start;
		const totalSeconds = Math.floor(elapsed / 1000);

		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);

		if (hours > 0) return `${hours} hr ${minutes} min`;
		return `${minutes} min`;
	};

	const activityIcon = (activity: DiscordActivity) => {
		const name = activity.name.toLowerCase();
		if (name.includes('visual studio code')) return 'i-lucide-code';
		if (name.includes('minecraft')) return 'i-lucide-cube';
		return 'i-lucide-activity';
	};

	const activityTypeConfig = (activity: DiscordActivity) => {
		const name = activity.name.toLowerCase();
		if (name.includes('visual studio code')) {
			return { icon: 'i-lucide-code-2', text: 'Coding' };
		}
		switch (activity.type) {
			case 0:
				return { icon: 'i-lucide-gamepad-2', text: 'Playing' };
			case 1:
				return { icon: 'i-lucide-video', text: 'Streaming' };
			case 2:
				return { icon: 'i-lucide-music', text: 'Listening' };
			case 3:
				return { icon: 'i-lucide-eye', text: 'Watching' };
			case 4:
				return { icon: 'i-lucide-trophy', text: 'Competing' };
			default:
				return { icon: 'i-lucide-activity', text: '' };
		}
	};

	const getAssetUrl = (activity: DiscordActivity, type: 'large' | 'small') => {
		if (!activity.assets) return '';

		const assetId =
			type === 'large'
				? activity.assets.large_image
				: activity.assets.small_image;

		if (!assetId) return '';

		if (assetId.startsWith('spotify:')) {
			return type === 'large'
				? discordData.value?.data.spotify?.album_art_url || ''
				: '';
		}

		if (assetId.startsWith('mp:external')) {
			const url = assetId.split('/https/')[1];
			return url ? `https://${decodeURIComponent(url)}` : '';
		}

		if (activity.application_id) {
			return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${assetId}.png`;
		}

		return '';
	};

	const imageUrlsToPreload = computed(() => {
		const urls: string[] = [];

		if (
			discordData.value.data.discord_user.id &&
			discordData.value.data.discord_user.avatar
		) {
			urls.push(
				`https://cdn.discordapp.com/avatars/${discordData.value.data.discord_user.id}/${discordData.value.data.discord_user.avatar}.png`
			);
		}

		urls.push(
			'https://cdn.discordapp.com/avatar-decoration-presets/a_671c4fcfb8d06e05fec00b061c720f7d.png?size=96'
		);

		// افکت‌ها رو فعلاً کامنت کردم چون URLها کار نمی‌کنن (توضیح پایین)
		// urls.push('https://cdn.discordapp.com/assets/content/03bd90626dfe50185af92560593a6b3b2b268b7fa77110304b36a9e387d9969e');
		// urls.push('https://cdn.discordapp.com/assets/content/51bacef4c6356197123cf2fb9426f86edc3d7678b05a5ec29fc46ee7510b8087');

		discordData.value.data.activities.forEach((act) => {
			const large = getAssetUrl(act, 'large');
			const small = getAssetUrl(act, 'small');
			if (large) urls.push(large);
			if (small) urls.push(small);
		});

		if (discordData.value.data.spotify?.album_art_url) {
			urls.push(discordData.value.data.spotify.album_art_url);
		}

		if (customStatusEmoji.value?.type === 'custom') {
			urls.push(customStatusEmoji.value.value);
		}

		return [...new Set(urls)];
	});

	watch(
		() => discordData.value.success,
		(newVal) => {
			if (newVal && process.client) {
				nextTick(() => {
					imageUrlsToPreload.value.forEach((url) => {
						const img = new Image();
						img.src = url;
					});
				});
			}
		},
		{ immediate: true }
	);
</script>

<template>
	<div class="w-full max-w-md min-w-20">
		<UCard
			class="relative bg-black border border-black/2 shadow-xl rounded-3xl overflow-hidden flex flex-col"
			:ui="{ body: { base: 'p-6 flex-1 flex flex-col' } }"
		>
			<!-- Skeleton Loader فقط برای لود اولیه -->
			<div
				v-if="isInitialLoading"
				class="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
			>
				<div class="flex flex-col items-center gap-4">
					<div class="w-20 h-20 rounded-full bg-white/10 animate-pulse"></div>
					<div class="space-y-3 w-64 flex-1 flex flex-col">
						<!-- <div class="h-6 bg-white/10 rounded animate-pulse"></div>
						<div class="h-4 bg-white/10 rounded w-40 animate-pulse"></div>
						<div class="h-16 bg-white/10 rounded animate-pulse"></div> -->
					</div>
				</div>
			</div>

			<!-- Discord Profile Effects -->
			<div
				v-if="!isInitialLoading"
				class="profile-effects-container"
			>
				<img
					src="/03bd90626dfe50185af92560593a6b3b2b268b7fa77110304b36a9e387d9969e.png"
					class="profile-effect intro-effect"
					loading="eager"
				/>
				<img
					src="/51bacef4c6356197123cf2fb9426f86edc3d7678b05a5ec29fc46ee7510b8087.png"
					class="profile-effect loop-effect"
					loading="eager"
				/>
			</div>
			<div
				v-if="discordError"
				class="text-red-500 text-center"
			>
				Failed to load Discord status
			</div>
			<div
				v-else
				class="flex flex-col flex-1"
			>
				<!-- بقیه تمپلیت همانند قبل بدون تغییر -->
				<div class="flex items-center gap-4" :class="hasAnyActivity ? 'pb-6' : ''">
					<ULink
						to="https://discord.gg/9ngaRvjGBp"
						target="_blank"
					>
						<div class="relative w-fit">
							<UAvatar
								:src="`/3bd3dd19a9ee8af9b815db378aa2ebea.png`"
								:alt="discordData.data.discord_user.display_name"
								size="3xl"
								class="cursor-pointer"
								loading="eager"
							/>

							<img
								src="/a_671c4fcfb8d06e05fec00b061c720f7d.png"
								alt=""
								class="scale-125 pointer-events-none absolute inset-[0%] object-contain"
								loading="eager"
							/>
						</div>
					</ULink>

					<div class="flex-1 min-w-0">
						<div class="flex items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<h3
									class="text-xl font-semibold transition-all duration-300"
									:class="
										discordData.data.discord_status === 'offline'
											? 'text-muted'
											: 'gradient-name glow'
									"
								>
									{{ discordData.data.discord_user.display_name }}
								</h3>
								<div class="flex gap-0">
									<UIcon
										v-for="device in devices"
										:key="device.name"
										:name="device.icon"
										class="w-4 h-4 text-green-500"
										:title="device.name"
									/>
								</div>
							</div>
						</div>
						<div class="flex items-center gap-2">
							<UIcon
								:name="statusConfig.icon"
								:class="['-mr-1 w-4 h-4', statusConfig.color]"
							/>
							<p class="text-sm text-muted">{{ statusConfig.text }}</p>
						</div>
					</div>
				</div>

				<div
					v-if="customStatus"
					class="relative"
				>
					<div class="flex items-center gap-2 mb-1">
						<UIcon
							name="i-lucide-message-circle"
							class="-mr-1 w-4 h-4 text-green-500"
						/>
						<p class="text-xs text-muted">Status</p>
					</div>

					<div class="relative border border-white/10 rounded-lg p-2">
						<div
							class="flex items-center gap-1 text-sm font-medium text-white truncate"
						>
							<span
								v-if="customStatusEmoji?.type === 'unicode'"
								class="text-base leading-none"
							>
								{{ customStatusEmoji.value }}
							</span>

							<img
								v-else-if="customStatusEmoji?.type === 'custom'"
								:src="customStatusEmoji.value"
								alt=""
								class="w-4 h-4"
								loading="eager"
							/>

							<span class="truncate">
								{{ customStatus.state }}
							</span>
						</div>
					</div>
				</div>

				<hr
					v-if="
						(hasAnyActivity || discordData.data.listening_to_spotify) &&
						discordData.data.discord_status !== 'offline'
					"
					class="border-white/10 my-2"
				/>

				<div class="flex flex-col gap-4">
					<div
						v-if="primaryActivity"
						class="flex items-center gap-3 p-3 rounded-2xl bg-white/3"
					>
						<div class="relative shrink-0">
							<img
								v-if="getAssetUrl(primaryActivity, 'large')"
								:src="getAssetUrl(primaryActivity, 'large')"
								:alt="
									primaryActivity.assets?.large_text || primaryActivity.name
								"
								class="w-16 h-16 rounded-md"
								loading="eager"
							/>
							<UIcon
								v-else
								:name="activityIcon(primaryActivity)"
								class="w-16 h-16 text-muted"
							/>
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<UIcon
									:name="activityTypeConfig(primaryActivity).icon"
									class="-mr-1 w-4 h-4 text-green-500"
								/>
								<p class="text-xs text-muted">
									{{ activityTypeConfig(primaryActivity).text }}
								</p>
							</div>
							<div class="bg-white/5 border border-white/10 rounded-md p-2">
								<p class="text-sm font-medium text-white">
									{{ primaryActivity.name }}
								</p>
								<p
									v-if="primaryActivity.details"
									class="text-xs text-muted"
								>
									{{ primaryActivity.details }}
								</p>
								<p
									v-if="primaryActivity.state"
									class="text-xs text-muted"
								>
									{{ primaryActivity.state }}
								</p>
								<p
									v-if="primaryActivity?.timestamps?.start"
									class="text-[11px] text-muted mt-1"
								>
									{{ activityElapsed(primaryActivity) }} elapsed
								</p>
							</div>
						</div>
					</div>

					<div
						v-if="
							discordData.data.listening_to_spotify && discordData.data.spotify
						"
					>
						<div class="flex items-center gap-3 p-3 rounded-2xl bg-white/3">
							<img
								:src="discordData.data.spotify.album_art_url"
								alt="Album art"
								class="w-16 h-16 rounded-md"
								loading="eager"
							/>
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									<UIcon
										name="i-lucide-music"
										class="-mr-1 w-4 h-4 text-green-500"
									/>
									<p class="text-xs text-muted">Listening on Spotify</p>
								</div>
								<div class="bg-white/5 border border-white/10 rounded-md p-2">
									<p class="text-sm font-medium text-white">
										{{ discordData.data.spotify.song }}
									</p>
									<p class="text-xs text-muted">
										by {{ discordData.data.spotify.artist }}
									</p>
									<div
										v-if="spotifyProgress"
										class="mt-2"
									>
										<div
											class="flex justify-between text-[11px] text-muted mb-1"
										>
											<span>{{ spotifyProgress.currentTime }}</span>
											<span>{{ spotifyProgress.endTime }}</span>
										</div>

										<div
											class="w-full h-1 bg-white/10 rounded-full overflow-hidden"
										>
											<div
												class="h-full bg-green-500 transition-all duration-500"
												:style="{ width: spotifyProgress.percentage + '%' }"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div
						v-for="activity in otherActivities"
						:key="activity.id"
						class="flex items-center gap-3 p-3 rounded-2xl bg-white/3"
					>
						<div class="relative shrink-0">
							<img
								v-if="getAssetUrl(activity, 'large')"
								:src="getAssetUrl(activity, 'large')"
								:alt="activity.assets?.large_text || activity.name"
								class="w-16 h-16 rounded-md"
								loading="eager"
							/>
							<UIcon
								v-else
								:name="activityIcon(activity)"
								class="w-16 h-16 text-muted"
							/>
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<UIcon
									:name="activityTypeConfig(activity).icon"
									class="-mr-1 w-4 h-4 text-green-500"
								/>
								<p class="text-xs text-muted">
									{{ activityTypeConfig(activity).text }}
								</p>
							</div>
							<div class="bg-white/5 border border-white/10 rounded-md p-2">
								<p class="text-sm font-medium text-white">
									{{ activity.name }}
								</p>
								<p
									v-if="activity.details"
									class="text-xs text-muted"
								>
									{{ activity.details }}
								</p>
								<p
									v-if="activity.state"
									class="text-xs text-muted"
								>
									{{ activity.state }}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<style scoped>
	.nameplate {
		position: absolute;
		top: 16px;
		left: 16px;
		width: 100%;
		max-width: 360px;
		height: auto;
		pointer-events: none;
		z-index: 0;
	}

	.text-white-shadow {
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.gradient-name {
		background-image: linear-gradient(45deg, #ff4848, #802c2c, #ff4848);
		background-size: 200%;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		font-weight: 600;
		animation: shimmer 1.7s linear infinite;
	}

	.glow:hover {
		text-shadow: 0 0 20px rgba(255, 72, 72, 0.6);
		filter: brightness(1.2);
		z-index: 100;
	}

	.profile-effects-container {
		position: absolute;
		inset: 0%;
		width: 450px;
		height: 880px;
		pointer-events: none;
		z-index: 200;
		overflow: hidden;
		animation-delay: 0.2s;
	}

	.profile-effect {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		animation-play-state: paused;
	}

	.profile-effects-container {
		animation-play-state: running !important;
	}

	.intro-effect {
		animation: playIntro 7s ease forwards;
		animation-play-state: inherit;
		z-index: 2;
	}

	.loop-effect {
		opacity: 0;
		animation: startLoop 3s ease forwards, slowFloat 8s linear infinite;
		animation-play-state: inherit;
		z-index: 1;
	}

	@keyframes shimmer {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 200% 50%;
		}
	}

	@keyframes fadeOut {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@keyframes playIntro {
		0% {
			opacity: 1;
		}
		99% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			visibility: hidden; /* کاملاً مخفی بشه تا لوپ تنها بمونه */
		}
	}

	@keyframes startLoop {
		0% {
			opacity: 0;
		}
		99% {
			opacity: 0;
		}
		100% {
			opacity: 0.6;
		}
	}

	@keyframes slowFloat {
		0% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
		100% {
			transform: translateY(0);
		}
	}
</style>

<script setup lang="ts">
	import { withLeadingSlash } from 'ufo';

	// Discord Widget Code
	// Define interface for Discord API response
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

	// Fetch Discord data on client-side with periodic refresh
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
	const discordError = ref(null);
	const fetchDiscordData = async () => {
		try {
			const response = await $fetch<{ data: DiscordData; success: boolean }>(
				'https://api.lanyard.rest/v1/users/1298823045959647254',
				{
					method: 'GET',
				}
			);
			discordData.value = response;
			discordError.value = null;
		} catch (err) {
			discordError.value = err;
		}
	};

	// Run fetch on client-side mount and every 10 seconds
	onMounted(() => {
		if (process.client) {
			fetchDiscordData(); // Initial fetch
			const interval = setInterval(fetchDiscordData, 1000); // Refresh every 1 seconds
			onUnmounted(() => clearInterval(interval)); // Cleanup on component unmount
		}
	});

	// Discord Computed properties for status and activities
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

		// Unicode emoji (🙏)
		if (emoji.name && !emoji.id) {
			return {
				type: 'unicode',
				value: emoji.name,
			};
		}

		// Custom Discord emoji (static or animated)
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
		if (!spotify) return null;

		const now = Date.now();
		const start = spotify.timestamps.start;
		const end = spotify.timestamps.end;

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

	const hasCustomStatus = computed(() => !!customStatus.value);

	const activityElapsed = (activity: DiscordActivity) => {
		if (!activity.timestamps?.start) return '';

		const elapsed = Date.now() - activity.timestamps.start;
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

	// Get Discord asset URLs
	const getAssetUrl = (activity: DiscordActivity, type: 'large' | 'small') => {
		if (!activity.assets) return '';

		const assetId =
			type === 'large'
				? activity.assets.large_image
				: activity.assets.small_image;

		if (!assetId) return '';

		// Spotify special case
		if (assetId.startsWith('spotify:')) {
			return type === 'large'
				? discordData.value?.data.spotify?.album_art_url || ''
				: '';
		}

		// Discord external media proxy (mp:external)
		if (assetId.startsWith('mp:external')) {
			const url = assetId.split('/https/')[1];
			return url ? `https://${url}` : '';
		}

		// Normal Discord app assets
		if (activity.application_id) {
			return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${assetId}.png`;
		}

		return '';
	};

	// GitHub Widget Code
	// interface GitHubUser {
	// 	login: string;
	// 	id: number;
	// 	node_id: string;
	// 	avatar_url: string;
	// 	gravatar_id: string;
	// 	url: string;
	// 	html_url: string;
	// 	followers_url: string;
	// 	following_url: string;
	// 	gists_url: string;
	// 	starred_url: string;
	// 	subscriptions_url: string;
	// 	organizations_url: string;
	// 	repos_url: string;
	// 	events_url: string;
	// 	received_events_url: string;
	// 	type: string;
	// 	site_admin: boolean;
	// 	name?: string;
	// 	company?: string;
	// 	blog?: string;
	// 	location?: string;
	// 	email?: string;
	// 	hireable?: boolean;
	// 	bio?: string;
	// 	twitter_username?: string;
	// 	public_repos: number;
	// 	public_gists: number;
	// 	followers: number;
	// 	following: number;
	// 	created_at: string;
	// 	updated_at: string;
	// }
	// interface GitHubRepo {
	// 	id: number;
	// 	node_id: string;
	// 	name: string;
	// 	full_name: string;
	// 	private: boolean;
	// 	owner: {
	// 		login: string;
	// 		id: number;
	// 		node_id: string;
	// 		avatar_url: string;
	// 		gravatar_id: string;
	// 		url: string;
	// 		html_url: string;
	// 		followers_url: string;
	// 		following_url: string;
	// 		gists_url: string;
	// 		starred_url: string;
	// 		subscriptions_url: string;
	// 		organizations_url: string;
	// 		repos_url: string;
	// 		events_url: string;
	// 		received_events_url: string;
	// 		type: string;
	// 		site_admin: boolean;
	// 	};
	// 	html_url: string;
	// 	description?: string;
	// 	fork: boolean;
	// 	url: string;
	// 	forks_url: string;
	// 	keys_url: string;
	// 	collaborators_url: string;
	// 	teams_url: string;
	// 	hooks_url: string;
	// 	issue_events_url: string;
	// 	events_url: string;
	// 	assignees_url: string;
	// 	branches_url: string;
	// 	tags_url: string;
	// 	blobs_url: string;
	// 	git_tags_url: string;
	// 	git_refs_url: string;
	// 	trees_url: string;
	// 	statuses_url: string;
	// 	languages_url: string;
	// 	stargazers_url: string;
	// 	subscribers_url: string;
	// 	subscription_url: string;
	// 	commits_url: string;
	// 	contents_url: string;
	// 	compare_url: string;
	// 	merges_url: string;
	// 	archive_url: string;
	// 	downloads_url: string;
	// 	issues_url: string;
	// 	pulls_url: string;
	// 	milestones_url: string;
	// 	notifications_url: string;
	// 	labels_url: string;
	// 	releases_url: string;
	// 	deployments_url: string;
	// 	created_at: string;
	// 	updated_at: string;
	// 	pushed_at: string;
	// 	git_url: string;
	// 	ssh_url: string;
	// 	clone_url: string;
	// 	svn_url: string;
	// 	homepage?: string;
	// 	size: number;
	// 	stargazers_count: number;
	// 	watchers_count: number;
	// 	language?: string;
	// 	has_issues: boolean;
	// 	has_projects: boolean;
	// 	has_downloads: boolean;
	// 	has_wiki: boolean;
	// 	has_pages: boolean;
	// 	has_discussions: boolean;
	// 	archived: boolean;
	// 	disabled: boolean;
	// 	visibility: string;
	// 	license?: {
	// 		key: string;
	// 		name: string;
	// 		node_id: string;
	// 		spdx_id: string;
	// 		url: string | null;
	// 		html_url?: string;
	// 	};
	// 	allow_forking: boolean;
	// 	is_template: boolean;
	// 	forks: number;
	// 	open_issues: number;
	// 	watchers: number;
	// 	default_branch: string;
	// 	permissions?: {
	// 		admin: boolean;
	// 		maintain?: boolean;
	// 		push?: boolean;
	// 		triage?: boolean;
	// 		pull?: boolean;
	// 	};
	// }

	// // Fetch GitHub data
	// const { data: githubData, error: githubError } = await useFetch<GitHubUser>(
	// 	'https://api.github.com/users/ghofran565',
	// 	{
	// 		server: true,
	// 		watch: false,
	// 		default: () => null,
	// 	}
	// );
	// const { data: githubReposData, error: githubReposError } = await useFetch<
	// 	GitHubRepo[]
	// >('https://api.github.com/users/ghofran565/repos?sort=updated&per_page=1', {
	// 	server: true,
	// 	watch: false,
	// 	default: () => [],
	// });

	// // GitHub computed properties
	// const githubStats = computed(() => ({
	// 	repos: githubData.value?.public_repos || 0,
	// 	followers: githubData.value?.followers || 0,
	// 	following: githubData.value?.following || 0,
	// 	gists: githubData.value?.public_gists || 0,
	// }));
	// const githubTopRepos = computed(() => {
	// 	return githubReposData.value.slice(0, 1).map((repo) => ({
	// 		name: repo.name,
	// 		description: repo.description,
	// 		language: repo.language,
	// 		stars: repo.stargazers_count,
	// 		forks: repo.forks,
	// 		html_url: repo.html_url,
	// 	}));
	// });

	// // Language color mapping
	// const getLanguageColor = (language: string) => {
	// 	const colors: { [key: string]: string } = {
	// 		javascript: '#f7df1e',
	// 		typescript: '#3178c6',
	// 		python: '#3776ab',
	// 		java: '#007396',
	// 		cpp: '#00599c',
	// 		rust: '#dea584',
	// 		go: '#00add8',
	// 		php: '#777bb4',
	// 		ruby: '#701516',
	// 		swift: '#f05138',
	// 		kotlin: '#00a2ee',
	// 		dart: '#0175c2',
	// 		vue: '#42b883',
	// 		react: '#61dafb',
	// 		html: '#e34f26',
	// 		css: '#1572b6',
	// 		scss: '#c6538c',
	// 		json: '#ff9900',
	// 		yaml: '#ff8c00',
	// 		dockerfile: '#384d54',
	// 		shell: '#89e051',
	// 		makefile: '#427819',
	// 		gitignore: '#e44b27',
	// 		markdown: '#e15730',
	// 		default: '#6a737d',
	// 	};
	// 	return colors[language?.toLowerCase() || 'default'] || colors.default;
	// };
</script>

<template>
	<div class="screen-center">
		<div
			class="flex flex-col sm:flex-row items-start justify-center gap-6 w-full max-w-7xl px-4 py-8"
		>
			<!-- GitHub Widget -->

			<!-- Discord Widget -->
			<div class="w-full max-w-md min-w-20">
				<UCard
					class="relative min-h-[100px] bg-black border border-black/2 shadow-xl rounded-2xl overflow-hidden flex flex-col"
					:ui="{ body: { base: 'p-6 flex-1 flex flex-col' } }"
				>
					<!-- Discord Profile Effects -->
					<!-- Profile Effect OR Nameplate -->
					<template>
						<img
							src="https://cdn.discordapp.com/assets/content/03bd90626dfe50185af92560593a6b3b2b268b7fa77110304b36a9e387d9969e"
							class="profile-effect first-load"
						/>

						<img
							src="https://cdn.discordapp.com/assets/content/51bacef4c6356197123cf2fb9426f86edc3d7678b05a5ec29fc46ee7510b8087"
							class="profile-effect loop"
						/>
					</template>

					<div
						v-if="discordError"
						class="text-red-500 text-center"
					>
						Failed to load Discord status
					</div>
					<div
						v-else
						class="flex flex-col gap-3 flex-1"
					>
						<!-- User Info -->
						<div class="flex items-center gap-4">
							<ULink
								to="https://discord.gg/9ngaRvjGBp"
								target="_blank"
							>
								<div class="relative w-fit">
									<!-- Avatar -->
									<UAvatar
										:src="`https://cdn.discordapp.com/avatars/${discordData.data.discord_user.id}/${discordData.data.discord_user.avatar}.png`"
										:alt="discordData.data.discord_user.display_name"
										size="3xl"
										class="cursor-pointer"
									/>

									<!-- Avatar Decoration -->
									<img
										src="https://cdn.discordapp.com/avatar-decoration-presets/a_671c4fcfb8d06e05fec00b061c720f7d.png?size=96"
										alt=""
										class="scale-125 pointer-events-none absolute inset-[0%] object-contain"
									/>
								</div>
							</ULink>

							<div class="flex-1 min-w-0">
								<div class="flex items-center justify-between gap-2">
									<div class="flex items-center gap-2">
										<h3
											class="text-xl font-semibold transition-all duration-300"
											:class="
												(discordData.data.discord_status === 'offline'
													? 'text-muted'
													: 'gradient-name glow')
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
						<!-- Custom Status -->
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
									<!-- Emoji -->
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
									/>

									<!-- Status text -->
									<span class="truncate">
										{{ customStatus.state }}
									</span>
								</div>
							</div>
						</div>

						<!-- Separator (hidden when offline) -->
						<hr
							v-if="
								(hasAnyActivity || discordData.data.listening_to_spotify) &&
								discordData.data.discord_status !== 'offline'
							"
							class="border-white/10 my-2"
						/>

						<!-- Activities -->
						<div class="flex flex-col gap-4">
							<!-- Spotify Activity -->
							<div
								v-if="
									discordData.data.listening_to_spotify &&
									discordData.data.spotify
								"
							>
								<div class="flex items-center gap-3 p-3 rounded-2xl bg-white/3">
									<img
										:src="discordData.data.spotify.album_art_url"
										alt="Album art"
										class="w-12 h-12 rounded-md"
									/>
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-1">
											<UIcon
												name="i-lucide-music"
												class="-mr-1 w-4 h-4 text-green-500"
											/>
											<p class="text-xs text-muted">Listening on Spotify</p>
										</div>
										<div
											class="bg-white/5 border border-white/10 rounded-md p-2"
										>
											<p class="text-sm font-medium text-white">
												{{ discordData.data.spotify.song }}
											</p>
											<p class="text-xs text-muted">
												by {{ discordData.data.spotify.artist }}
											</p>
											<!-- Spotify Progress -->
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
							<!-- Primary Activity -->
							<div
								v-if="primaryActivity"
								class="flex items-center gap-3 p-3 rounded-2xl bg-white/3"
							>
								<div class="relative flex-shrink-0">
									<img
										v-if="getAssetUrl(primaryActivity, 'large')"
										:src="getAssetUrl(primaryActivity, 'large')"
										:alt="
											primaryActivity.assets?.large_text || primaryActivity.name
										"
										class="w-12 h-12 rounded-md"
									/>
									<UIcon
										v-else
										:name="activityIcon(primaryActivity)"
										class="w-12 h-12 text-muted"
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
											{{ activityElapsed(primaryActivity) }}
										</p>
									</div>
								</div>
							</div>
							<!-- Other Activities -->
							<div
								v-for="activity in otherActivities"
								:key="activity.id"
								class="flex items-center gap-3 p-3 rounded-2xl bg-white/3"
							>
								<div class="relative flex-shrink-0">
									<img
										v-if="getAssetUrl(activity, 'large')"
										:src="getAssetUrl(activity, 'large')"
										:alt="activity.assets?.large_text || activity.name"
										class="w-12 h-12 rounded-md"
									/>
									<UIcon
										v-else
										:name="activityIcon(activity)"
										class="w-12 h-12 text-muted"
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
		/* background-color: #121212; optional: screen bg color */
	}

	.nameplate {
		position: absolute;
		top: 16px; /* Discord-like spacing */
		left: 16px;
		width: 100%;
		max-width: 360px; /* matches Discord nameplate width */
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
		animation: shimmer 1.4s linear infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: 0% 50%;
		}
		100% {
			background-position: 200% 50%;
		}
	}
	.aqua-gradient {
		background-image: linear-gradient(45deg, #00d4ff, #0286b3, #00d4ff);
		background-size: 200%;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		font-weight: 600;
		animation: shimmer 1.7s linear infinite;
	}

	/* Soft glow on hover for the Discord name */
	.glow {
		text-shadow: 0 0 20px rgba(255, 72, 72, 0.6);
		filter: brightness(1.2);
	}

	.profile-effect {
		position: absolute;
		inset: 0%;
		width: 450px;
		height: 880px;
		object-fit: cover;
		pointer-events: none;
		z-index: 0;
	}

	.profile-effect.first-load {
		animation: fadeOut 10s ease forwards;
	}

	.profile-effect.loop {
		opacity: 0.6;
		animation: slowFloat 8s linear infinite;
	}

	@keyframes fadeOut {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
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

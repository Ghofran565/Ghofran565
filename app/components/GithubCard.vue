<script setup lang="ts">
	
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

</template>

<style scoped>
   	.aqua-gradient {
		background-image: linear-gradient(45deg, #00d4ff, #0286b3, #00d4ff);
		background-size: 200%;
		background-clip: text;
		-webkit-background-clip: text;
		color: transparent;
		font-weight: 600;
		animation: shimmer 1.7s linear infinite;
	}

</style>
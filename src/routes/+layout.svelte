<script>
	import '../app.css';
	import Toast from '$components/ui/Toast.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>CollectRelay — Send requests. Collect files. Stay on track.</title>
</svelte:head>

{@render children()}
<Toast />

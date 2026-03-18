<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Hero from '$components/marketing/Hero.svelte';
	import SocialProof from '$components/marketing/SocialProof.svelte';
	import HowItWorks from '$components/marketing/HowItWorks.svelte';
	import Features from '$components/marketing/Features.svelte';
	import RealEstate from '$components/marketing/RealEstate.svelte';
	import ClosingCTA from '$components/marketing/ClosingCTA.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>CollectRelay — Stop Chasing Paperwork. Start Closing Projects.</title>
	<meta name="description" content="CollectRelay turns document chaos into organized checklists. Built for real estate pros and contractors." />
</svelte:head>

<Navbar />

<main>
	<Hero />
	<SocialProof />
	<HowItWorks />
	<Features />
	<RealEstate />
	<ClosingCTA />
</main>

<Footer />

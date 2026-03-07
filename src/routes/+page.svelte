<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Hero from '$components/marketing/Hero.svelte';
	import SocialProof from '$components/marketing/SocialProof.svelte';
	import Problem from '$components/marketing/Problem.svelte';
	import HowItWorks from '$components/marketing/HowItWorks.svelte';
	import Features from '$components/marketing/Features.svelte';
	import RealEstate from '$components/marketing/RealEstate.svelte';
	import WhyCollectRelay from '$components/marketing/WhyCollectRelay.svelte';
	import Security from '$components/marketing/Security.svelte';
	import ClosingCTA from '$components/marketing/ClosingCTA.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>CollectRelay — Send requests. Collect files. Stay on track.</title>
	<meta name="description" content="A simple client portal for document collection, checklists, and e-signatures. Built for real estate pros, contractors, and accountants." />
</svelte:head>

<Navbar />

<main>
	<Hero />
	<SocialProof />
	<Problem />
	<HowItWorks />
	<Features />
	<RealEstate />
	<WhyCollectRelay />
	<Security />
	<ClosingCTA />
</main>

<Footer />

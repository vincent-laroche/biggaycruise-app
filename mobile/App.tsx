import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { getGuestAppStatus, type GuestAppStatus } from "./src/api/client";

type Tab = "home" | "cruises" | "pass" | "guide" | "profile";

const COLORS = {
  navy: "#0A1946",
  aqua: "#10D8D2",
  pink: "#F63D91",
  yellow: "#FFE33B",
  mint: "#ECFFFC",
  ink: "#1D2E5B",
  muted: "#60709A",
  white: "#FFFFFF",
  border: "#C5E6E3",
};

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "cruises", label: "Cruises", icon: "◌" },
  { id: "pass", label: "My Pass", icon: "▣" },
  { id: "guide", label: "Guide", icon: "✦" },
  { id: "profile", label: "Profile", icon: "☺" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [status, setStatus] = useState<GuestAppStatus>({ state: "loading" });

  useEffect(() => {
    let mounted = true;
    getGuestAppStatus().then((next) => {
      if (mounted) setStatus(next);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header activeTab={activeTab} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === "home" && <Home status={status} onOpenWebsite={() => Linking.openURL("https://biggaycruise.com/")} />}
          {activeTab === "cruises" && <Cruises status={status} />}
          {activeTab === "pass" && <Pass status={status} />}
          {activeTab === "guide" && <Guide status={status} />}
          {activeTab === "profile" && <Profile />}
        </ScrollView>
        <View style={styles.tabBar}>
          {tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onPress={() => setActiveTab(tab.id)} />)}
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header({ activeTab }: { activeTab: Tab }) {
  const title = tabs.find((tab) => tab.id === activeTab)?.label ?? "Home";
  return <View style={styles.header}><View style={styles.brandMark}><Text style={styles.brandMarkText}>✦</Text></View><View><Text style={styles.brandTitle}>BIG GAY CRUISE</Text><Text style={styles.brandSubtitle}>{title.toUpperCase()}</Text></View><View style={styles.privatePill}><Text style={styles.privatePillText}>PRIVATE</Text></View></View>;
}

function Home({ status, onOpenWebsite }: { status: GuestAppStatus; onOpenWebsite: () => void }) {
  return <>
    <View style={styles.hero}><View style={styles.heroOrbit} /><Text style={styles.eyebrowLight}>YOUR CRUISE, IN ONE PLACE</Text><Text style={styles.heroTitle}>The BGC companion is getting ready for you.</Text><Text style={styles.heroCopy}>Your cruise, pass, reminders, onboard guide, and next adventure will live here once BGC connects your booking.</Text></View>
    <DataState status={status} />
    <SectionTitle kicker="COMING TO YOUR HOME" title="Everything you need, when you need it." />
    <View style={styles.featureGrid}><FeatureCard accent="pink" icon="▣" title="My BGC Pass" copy="A secure, live QR credential for onboard BGC access after your pass is confirmed paid." /><FeatureCard accent="yellow" icon="✓" title="Your checklist" copy="Clear pre-cruise tasks and timely reminders, without hunting through email." /><FeatureCard accent="aqua" icon="✦" title="Cruise guide" copy="Events, key moments, and useful links for your BGC group cruise." /><FeatureCard accent="pink" icon="↗" title="Next adventure" copy="See future cruises and share the next big trip with friends." /></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open Big Gay Cruise website" onPress={onOpenWebsite} style={({ pressed }) => [styles.websiteButton, pressed && styles.pressed]}><Text style={styles.websiteButtonText}>Explore Big Gay Cruise</Text><Text style={styles.websiteArrow}>↗</Text></Pressable>
  </>;
}

function Cruises({ status }: { status: GuestAppStatus }) { return <><SectionTitle kicker="MY CRUISES" title="Your BGC story starts here." /><DataState status={status} compact /><InfoCard title="Upcoming and past cruises" copy="Connected guests will see confirmed sailings, completion history, and the right next action for each trip." icon="◌" /></>; }
function Pass({ status }: { status: GuestAppStatus }) { return <><SectionTitle kicker="MY BGC PASS" title="Your access, verified live." /><DataState status={status} compact /><InfoCard title="A dynamic QR, not a screenshot" copy="When your booking and paid pass are connected, this screen will display a short-lived QR for staff validation onboard." icon="▣" /></>; }
function Guide({ status }: { status: GuestAppStatus }) { return <><SectionTitle kicker="CRUISE GUIDE" title="Know what’s next." /><DataState status={status} compact /><InfoCard title="Events and reminders" copy="Your connected cruise guide will surface event timing, optional extras, and reminders for the things that still need doing." icon="✦" /></>; }
function Profile() { return <><SectionTitle kicker="PROFILE" title="Your travel settings." /><InfoCard title="Notification controls" copy="Choose how BGC can reach you for high-value reminders, onboard updates, and next-cruise news." icon="☺" /><InfoCard title="Privacy first" copy="BGC will use booking and pass information only to provide your travel experience and authorized operational support." icon="⌁" /></>; }

function DataState({ status, compact = false }: { status: GuestAppStatus; compact?: boolean }) {
  if (status.state === "loading") return <View style={[styles.stateCard, compact && styles.stateCardCompact]}><ActivityIndicator color={COLORS.pink} /><Text style={styles.stateTitle}>Checking your BGC connection…</Text></View>;
  return <View style={[styles.stateCard, compact && styles.stateCardCompact]}><View style={styles.stateIcon}><Text style={styles.stateIconText}>i</Text></View><View style={styles.stateBody}><Text style={styles.stateTitle}>{status.title}</Text><Text style={styles.stateCopy}>{status.detail}</Text></View></View>;
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) { return <View style={styles.sectionTitle}><Text style={styles.eyebrow}>{kicker}</Text><Text style={styles.sectionHeading}>{title}</Text></View>; }
function FeatureCard({ accent, icon, title, copy }: { accent: "pink" | "yellow" | "aqua"; icon: string; title: string; copy: string }) { const accentColor = accent === "pink" ? COLORS.pink : accent === "yellow" ? COLORS.yellow : COLORS.aqua; return <View style={styles.featureCard}><View style={[styles.featureIcon, { backgroundColor: accentColor }]}><Text style={styles.featureIconText}>{icon}</Text></View><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureCopy}>{copy}</Text></View>; }
function InfoCard({ title, copy, icon }: { title: string; copy: string; icon: string }) { return <View style={styles.infoCard}><View style={styles.infoIcon}><Text style={styles.infoIconText}>{icon}</Text></View><View style={styles.infoBody}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoCopy}>{copy}</Text></View></View>; }
function TabButton({ tab, active, onPress }: { tab: typeof tabs[number]; active: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><Text style={[styles.tabIcon, active && styles.tabTextActive]}>{tab.icon}</Text><Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text></Pressable>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.mint }, appShell: { flex: 1, backgroundColor: COLORS.mint }, header: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, backgroundColor: COLORS.aqua, borderBottomWidth: 2, borderBottomColor: COLORS.navy }, brandMark: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.pink, shadowColor: COLORS.navy, shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }, brandMarkText: { color: COLORS.white, fontSize: 20, fontWeight: "900" }, brandTitle: { color: COLORS.navy, fontSize: 14, fontWeight: "900", letterSpacing: 1.4 }, brandSubtitle: { color: COLORS.ink, fontSize: 9, fontWeight: "800", letterSpacing: 1.5, marginTop: 2 }, privatePill: { marginLeft: "auto", borderColor: COLORS.navy, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.white }, privatePillText: { color: COLORS.navy, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, content: { padding: 18, paddingBottom: 34 }, hero: { overflow: "hidden", position: "relative", backgroundColor: COLORS.navy, borderColor: COLORS.navy, borderWidth: 2, borderRadius: 24, padding: 22, shadowColor: COLORS.navy, shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }, heroOrbit: { position: "absolute", width: 128, height: 128, borderRadius: 64, borderWidth: 18, borderColor: COLORS.yellow, right: -42, top: -42 }, eyebrowLight: { color: COLORS.yellow, fontSize: 10, letterSpacing: 1.8, fontWeight: "900" }, heroTitle: { marginTop: 10, maxWidth: 300, color: COLORS.white, fontSize: 30, lineHeight: 33, fontWeight: "900", letterSpacing: -0.8 }, heroCopy: { marginTop: 14, maxWidth: 310, color: "#D3FFFB", fontSize: 15, lineHeight: 22 }, stateCard: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 20, borderWidth: 1.5, borderColor: "#8ACFCB", borderRadius: 18, padding: 15, backgroundColor: COLORS.white }, stateCardCompact: { marginTop: 0, marginBottom: 18 }, stateIcon: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.yellow, borderWidth: 1, borderColor: COLORS.navy }, stateIconText: { color: COLORS.navy, fontWeight: "900" }, stateBody: { flex: 1 }, stateTitle: { color: COLORS.navy, fontSize: 14, lineHeight: 19, fontWeight: "800" }, stateCopy: { marginTop: 3, color: COLORS.muted, fontSize: 13, lineHeight: 19 }, sectionTitle: { marginTop: 28, marginBottom: 13 }, eyebrow: { color: "#A51057", fontSize: 10, letterSpacing: 1.6, fontWeight: "900" }, sectionHeading: { marginTop: 5, color: COLORS.navy, fontSize: 23, lineHeight: 28, fontWeight: "900", letterSpacing: -0.4 }, featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, featureCard: { width: "48.5%", minHeight: 160, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 18, padding: 14, backgroundColor: COLORS.white }, featureIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.navy }, featureIconText: { color: COLORS.navy, fontSize: 17, fontWeight: "900" }, featureTitle: { marginTop: 12, color: COLORS.navy, fontSize: 14, fontWeight: "900" }, featureCopy: { marginTop: 5, color: COLORS.muted, fontSize: 12, lineHeight: 17 }, websiteButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingVertical: 15, paddingHorizontal: 17, borderRadius: 15, borderWidth: 2, borderColor: COLORS.navy, backgroundColor: COLORS.pink, shadowColor: COLORS.navy, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }, websiteButtonText: { color: COLORS.white, fontSize: 15, fontWeight: "900" }, websiteArrow: { color: COLORS.white, fontSize: 19, fontWeight: "900" }, infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 17, marginBottom: 12, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white }, infoIcon: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.pink }, infoIconText: { color: COLORS.white, fontSize: 20, fontWeight: "900" }, infoBody: { flex: 1 }, infoTitle: { color: COLORS.navy, fontSize: 15, fontWeight: "900" }, infoCopy: { marginTop: 4, color: COLORS.muted, fontSize: 13, lineHeight: 19 }, tabBar: { flexDirection: "row", paddingTop: 8, paddingBottom: 12, paddingHorizontal: 8, backgroundColor: COLORS.white, borderTopColor: COLORS.border, borderTopWidth: 1 }, tabButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", gap: 3 }, tabIcon: { color: COLORS.muted, fontSize: 18, fontWeight: "900" }, tabText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" }, tabTextActive: { color: COLORS.pink }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});

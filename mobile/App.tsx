import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import QRCode from "react-native-qrcode-svg";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { getGuestExperience, getGuestQrCredential, isApiConfigured, type GuestExperience, type GuestQrCredential } from "./src/api/client";

type Tab = "home" | "cruises" | "pass" | "guide" | "profile";
type IconName = keyof typeof Ionicons.glyphMap;

const COLORS = {
  canvas: "#F5F7F8",
  surface: "#FFFFFF",
  ink: "#111318",
  secondary: "#757B84",
  line: "#E9ECEF",
  blue: "#A9DCF4",
  blueSoft: "#E9F5FB",
  blueDeep: "#4A9EC2",
  pink: "#EE6C9C",
  pinkSoft: "#FFF0F5",
  green: "#1B9B72",
  greenSoft: "#E8F8F1",
  cream: "#FFF9E9",
  black: "#0B0C0F",
};

const tabs: Array<{ id: Tab; label: string; icon: IconName; activeIcon: IconName }> = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "cruises", label: "Trips", icon: "boat-outline", activeIcon: "boat" },
  { id: "pass", label: "Pass", icon: "ticket-outline", activeIcon: "ticket" },
  { id: "guide", label: "Guide", icon: "compass-outline", activeIcon: "compass" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [experience, setExperience] = useState<GuestExperience | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<GuestQrCredential | null>(null);

  const loadExperience = () => {
    setLoading(true);
    setError(null);
    getGuestExperience()
      .then(setExperience)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "We could not load this BGC experience."))
      .finally(() => setLoading(false));
  };

  useEffect(loadExperience, []);
  useEffect(() => {
    if (activeTab !== "pass" || !experience) return;
    getGuestQrCredential().then(setCredential).catch(() => setCredential(null));
  }, [activeTab, experience]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <LoadingState /> : error || !experience ? <ConnectionState error={error} onRetry={loadExperience} /> : <>
            <PageHeader activeTab={activeTab} guestName={experience.guest.displayName} />
            {activeTab === "home" && <Home experience={experience} onOpenWebsite={() => Linking.openURL("https://biggaycruise.com/")} />}
            {activeTab === "cruises" && <Cruises experience={experience} />}
            {activeTab === "pass" && <Pass experience={experience} credential={credential} />}
            {activeTab === "guide" && <Guide experience={experience} />}
            {activeTab === "profile" && <Profile experience={experience} />}
          </>}
        </ScrollView>
        <View style={styles.tabDock}>{tabs.map((tab) => <TabButton key={tab.id} tab={tab} active={activeTab === tab.id} onPress={() => setActiveTab(tab.id)} />)}</View>
      </View>
    </SafeAreaView>
  );
}

function PageHeader({ activeTab, guestName }: { activeTab: Tab; guestName: string }) {
  const firstName = guestName.split(" ")[0];
  const title = tabs.find((tab) => tab.id === activeTab)?.label ?? "Home";
  if (activeTab === "home") {
    return <View style={styles.topBar}>
      <View><Text style={styles.greeting}>Hello {firstName} <Text style={styles.wave}>👋</Text></Text><Text style={styles.welcomeBack}>Your next escape is waiting.</Text></View>
      <Pressable accessibilityRole="button" style={styles.roundButton}><Ionicons name="search-outline" size={21} color={COLORS.ink} /></Pressable>
    </View>;
  }
  return <View style={styles.topBar}><View><Text style={styles.pageTitle}>{title}</Text><Text style={styles.welcomeBack}>Big Gay Cruise</Text></View><View style={styles.logoDot}><Text style={styles.logoDotText}>B</Text></View></View>;
}

function Home({ experience, onOpenWebsite }: { experience: GuestExperience; onOpenWebsite: () => void }) {
  const cruise = experience.upcomingCruise;
  return <>
    <HeroCard experience={experience} />
    <SectionHeader title="Your cruise at a glance" action="View trip" />
    <View style={styles.passOverview}>
      <View style={styles.passOverviewTop}><View style={styles.iconBubble}><Ionicons name="ticket-outline" size={20} color={COLORS.ink} /></View><View style={styles.paidChip}><View style={styles.paidDot} /><Text style={styles.paidChipText}>{experience.pass.label}</Text></View></View>
      <Text style={styles.passOverviewTitle}>BGC Pass</Text>
      <Text style={styles.passOverviewCopy}>{cruise.destination} · {formatDate(cruise.departureDate)}</Text>
      <View style={styles.dottedRule} />
      <View style={styles.passOverviewFooter}><Text style={styles.passOverviewMeta}>Boarding credentials ready</Text><Ionicons name="arrow-forward" size={19} color={COLORS.ink} /></View>
    </View>
    <SectionHeader title="A few things left" action={`${experience.checklist.filter((item) => !item.completed).length} pending`} />
    <View style={styles.taskStack}>{experience.checklist.map((task) => <TaskCard key={task.id} task={task} />)}</View>
    <SectionHeader title="Worth a look" action="See all" />
    <View style={styles.reminderRow}>{experience.reminders.map((reminder, index) => <ReminderCard key={reminder.id} reminder={reminder} index={index} />)}</View>
    <SectionHeader title="Onboard moments" action="Cruise guide" />
    <View style={styles.eventList}>{experience.events.slice(0, 2).map((event) => <EventCard key={event.id} event={event} />)}</View>
    <Pressable accessibilityRole="link" onPress={onOpenWebsite} style={({ pressed }) => [styles.websiteLink, pressed && styles.pressed]}><Text style={styles.websiteLinkText}>Explore biggaycruise.com</Text><Ionicons name="arrow-up-outline" size={18} color={COLORS.surface} /></Pressable>
    <FixtureFooter notice={experience.notice} />
  </>;
}

function HeroCard({ experience }: { experience: GuestExperience }) {
  const cruise = experience.upcomingCruise;
  return <View style={styles.heroCard}>
    <HorizonArtwork />
    <View style={styles.heroTopRow}><View style={styles.dotMenu}><View style={styles.dot} /><View style={styles.dot} /><View style={styles.dot} /></View><View style={styles.heroArrow}><Ionicons name="arrow-up-right-box" size={19} color={COLORS.ink} /></View></View>
    <View style={styles.heroContent}><Text style={styles.heroEyebrow}>YOUR NEXT ESCAPE</Text><Text style={styles.heroTitle}>{cruise.destination}</Text><Text style={styles.heroCopy}>{cruise.name}</Text><View style={styles.heroStats}><View><Text style={styles.heroStatValue}>{formatShortDate(cruise.departureDate)}</Text><Text style={styles.heroStatLabel}>DEPARTURE</Text></View><View style={styles.heroDivider} /><View><Text style={styles.heroStatValue}>{experience.checklist.filter((item) => item.completed).length}/{experience.checklist.length}</Text><Text style={styles.heroStatLabel}>READY</Text></View></View></View>
    <View style={styles.demoLabel}><Text style={styles.demoLabelText}>DEMO TRIP</Text></View>
  </View>;
}

function HorizonArtwork() {
  return <View pointerEvents="none" style={styles.horizonArtwork}><View style={styles.sunDisc} /><View style={styles.cloudOne} /><View style={styles.cloudTwo} /><View style={styles.oceanLineOne} /><View style={styles.oceanLineTwo} /><View style={styles.shipHull} /><View style={styles.shipDeckOne} /><View style={styles.shipDeckTwo} /><View style={styles.shipWindowRow}><View style={styles.window} /><View style={styles.window} /><View style={styles.window} /><View style={styles.window} /></View></View>;
}

function Cruises({ experience }: { experience: GuestExperience }) {
  const cruise = experience.upcomingCruise;
  return <>
    <View style={styles.largeTripCard}><HorizonArtwork /><View style={styles.tripCardBody}><View style={styles.smallPill}><Text style={styles.smallPillText}>{cruise.groupStatus}</Text></View><Text style={styles.largeTripTitle}>{cruise.name}</Text><Text style={styles.largeTripDestination}>{cruise.destination}</Text><View style={styles.tripDetailsGrid}><Detail label="DEPARTURE" value={formatDate(cruise.departureDate)} /><Detail label="EXPERIENCE" value="BGC group cruise" /></View></View></View>
    <SectionHeader title="Your cruise history" action="0 complete" />
    <InfoPanel icon="boat-outline" title="New stories, all in one place." copy="Past BGC cruises will appear here once the approved booking source is connected." tone="blue" />
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Pass({ experience, credential }: { experience: GuestExperience; credential: GuestQrCredential | null }) {
  return <>
    <View style={styles.passPageIntro}><Text style={styles.eyebrow}>YOUR ACCESS</Text><Text style={styles.passPageTitle}>Your BGC pass,{"\n"}always with you.</Text><Text style={styles.passPageCopy}>Show this live pass to BGC staff once onboard. Your cruise relationship and pass status are verified on the server.</Text></View>
    <View style={styles.qrCard}><View style={styles.qrCardHeader}><View><Text style={styles.qrCardName}>{experience.guest.displayName}</Text><Text style={styles.qrCardSub}>BGC guest credential</Text></View><View style={styles.verifiedMark}><Ionicons name="checkmark" size={17} color={COLORS.surface} /></View></View>{credential ? <><View style={styles.qrCanvas}><QRCode value={credential.token} size={190} color={COLORS.ink} backgroundColor={COLORS.surface} /></View><Text style={styles.qrExpires}>Secure demo credential · refreshes at {formatTime(credential.expiresAt)}</Text></> : <View style={styles.qrPlaceholder}><ActivityIndicator color={COLORS.ink} /><Text style={styles.qrExpires}>Refreshing your secure pass…</Text></View>}<View style={styles.qrFooter}><View style={styles.qrFooterItem}><Ionicons name="shield-checkmark-outline" size={17} color={COLORS.ink} /><Text style={styles.qrFooterText}>Pass {experience.pass.label.toLowerCase()}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.ink} /></View></View>
    <InfoPanel icon="scan-outline" title="Live, not static." copy="The QR expires quickly and is checked against BGC’s source on every scan. A screenshot cannot act as an authoritative pass." tone="dark" />
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Guide({ experience }: { experience: GuestExperience }) {
  return <>
    <View style={styles.guideHero}><Text style={styles.eyebrow}>CRUISE GUIDE</Text><Text style={styles.guideTitle}>The right place,{"\n"}right on time.</Text><Text style={styles.guideCopy}>Your essentials, BGC moments, and timely reminders in one calm place.</Text></View>
    <SectionHeader title="Coming up" action="Onboard" />
    <View style={styles.eventList}>{experience.events.map((event) => <EventCard key={event.id} event={event} />)}</View>
    <SectionHeader title="Bring your people" action="Share" />
    <InfoPanel icon="people-outline" title={experience.nextCruise.title} copy={experience.nextCruise.detail} tone="pink" />
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Profile({ experience }: { experience: GuestExperience }) {
  return <>
    <View style={styles.profileHero}><View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{experience.guest.displayName.charAt(0)}</Text></View><Text style={styles.profileName}>{experience.guest.displayName}</Text><Text style={styles.profileEmail}>BGC guest account</Text></View>
    <View style={styles.profileMenu}><ProfileRow icon="notifications-outline" label="Notification preferences" sublabel="Cruise reminders and BGC updates" /><ProfileRow icon="link-outline" label="Connected accounts" sublabel="Website and future social connections" /><ProfileRow icon="information-circle-outline" label="Development environment" sublabel={`Synthetic guest ID · ${experience.guest.developmentId}`} /></View>
    <FixtureFooter notice={experience.notice} />
  </>;
}

function TaskCard({ task }: { task: GuestExperience["checklist"][number] }) { return <View style={styles.taskCard}><View style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>{task.completed ? <Ionicons name="checkmark" size={15} color={COLORS.surface} /> : null}</View><View style={styles.taskBody}><Text style={[styles.taskTitle, task.completed && styles.taskTitleComplete]}>{task.title}</Text><Text style={styles.taskCopy}>{task.detail}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.secondary} /></View>; }
function ReminderCard({ reminder, index }: { reminder: GuestExperience["reminders"][number]; index: number }) { const isBlue = index % 2 === 0; return <View style={[styles.reminderCard, isBlue ? styles.reminderCardBlue : styles.reminderCardPink]}><View style={styles.reminderCardTop}><View style={styles.reminderIcon}><Ionicons name={isBlue ? "sparkles-outline" : "heart-outline"} size={17} color={COLORS.ink} /></View><Ionicons name="arrow-up-right-box" size={17} color={COLORS.ink} /></View><Text style={styles.reminderTitle}>{reminder.title}</Text><Text style={styles.reminderCopy}>{reminder.detail}</Text></View>; }
function EventCard({ event }: { event: GuestExperience["events"][number] }) { return <View style={styles.eventCard}><View style={styles.eventDate}><Text style={styles.eventDateDay}>{event.timing.split(" ")[0]}</Text><Text style={styles.eventDateMonth}>BGC</Text></View><View style={styles.eventBody}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventDetail}>{event.timing}</Text><Text style={styles.eventPlace}>{event.location}</Text></View><View style={styles.eventArrow}><Ionicons name="arrow-forward" size={16} color={COLORS.ink} /></View></View>; }
function InfoPanel({ icon, title, copy, tone }: { icon: IconName; title: string; copy: string; tone: "blue" | "pink" | "dark" }) { const toneStyle = tone === "blue" ? styles.infoBlue : tone === "pink" ? styles.infoPink : styles.infoDark; const textStyle = tone === "dark" ? styles.infoDarkText : undefined; return <View style={[styles.infoPanel, toneStyle]}><View style={[styles.infoPanelIcon, tone === "dark" && styles.infoPanelIconDark]}><Ionicons name={icon} size={20} color={tone === "dark" ? COLORS.surface : COLORS.ink} /></View><View style={styles.infoPanelBody}><Text style={[styles.infoPanelTitle, textStyle]}>{title}</Text><Text style={[styles.infoPanelCopy, textStyle]}>{copy}</Text></View></View>; }
function ProfileRow({ icon, label, sublabel }: { icon: IconName; label: string; sublabel: string }) { return <View style={styles.profileRow}><View style={styles.profileRowIcon}><Ionicons name={icon} size={20} color={COLORS.ink} /></View><View style={styles.profileRowBody}><Text style={styles.profileRowLabel}>{label}</Text><Text style={styles.profileRowSub}>{sublabel}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.secondary} /></View>; }
function Detail({ label, value }: { label: string; value: string }) { return <View style={styles.detail}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>; }
function SectionHeader({ title, action }: { title: string; action: string }) { return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionAction}>{action}</Text></View>; }
function FixtureFooter({ notice }: { notice: string }) { return <View style={styles.fixtureFooter}><Ionicons name="flask-outline" size={14} color={COLORS.secondary} /><Text style={styles.fixtureFooterText}>{notice}</Text></View>; }
function TabButton({ tab, active, onPress }: { tab: typeof tabs[number]; active: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}><View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}><Ionicons name={active ? tab.activeIcon : tab.icon} size={19} color={active ? COLORS.surface : COLORS.secondary} /></View><Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text></Pressable>; }
function LoadingState() { return <View style={styles.loadingState}><ActivityIndicator color={COLORS.ink} size="large" /><Text style={styles.loadingTitle}>Setting up your BGC experience…</Text><Text style={styles.loadingCopy}>Just a moment while we prepare the details.</Text></View>; }
function ConnectionState({ error, onRetry }: { error: string | null; onRetry: () => void }) { const configured = isApiConfigured(); return <View style={styles.connectionState}><View style={styles.connectionIcon}><Ionicons name="cloud-offline-outline" size={27} color={COLORS.ink} /></View><Text style={styles.connectionTitle}>{configured ? "We can’t reach this BGC experience." : "Connect a BGC experience."}</Text><Text style={styles.connectionCopy}>{error ?? "Add a reachable BGC Worker URL to continue. The guest app never embeds production booking data."}</Text><Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}><Text style={styles.retryButtonText}>Try again</Text><Ionicons name="refresh" size={17} color={COLORS.surface} /></Pressable></View>; }

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00Z`)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00Z`)); }
function formatTime(value: string) { return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.canvas }, appShell: { flex: 1, backgroundColor: COLORS.canvas }, content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 126 },
  topBar: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, greeting: { color: COLORS.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.7 }, wave: { fontSize: 21 }, welcomeBack: { marginTop: 4, color: COLORS.secondary, fontSize: 13, fontWeight: "500" }, pageTitle: { color: COLORS.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.8 }, roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.17, shadowRadius: 18, elevation: 3 }, logoDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.black, alignItems: "center", justifyContent: "center" }, logoDotText: { color: COLORS.surface, fontSize: 17, fontWeight: "900" },
  heroCard: { height: 276, overflow: "hidden", borderRadius: 30, backgroundColor: COLORS.blue, padding: 20, position: "relative", shadowColor: "#9AA4AD", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 4 }, heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, dotMenu: { flexDirection: "row", gap: 4 }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.ink }, heroArrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" }, heroContent: { marginTop: 32, maxWidth: "75%" }, heroEyebrow: { color: COLORS.ink, fontSize: 10, fontWeight: "800", letterSpacing: 1.25 }, heroTitle: { marginTop: 7, color: COLORS.ink, fontSize: 30, lineHeight: 33, fontWeight: "800", letterSpacing: -1 }, heroCopy: { marginTop: 7, color: "#31404A", fontSize: 13, lineHeight: 18, fontWeight: "500" }, heroStats: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20 }, heroStatValue: { color: COLORS.ink, fontSize: 16, fontWeight: "800" }, heroStatLabel: { marginTop: 2, color: "#45606E", fontSize: 8, fontWeight: "800", letterSpacing: 1 }, heroDivider: { height: 26, width: 1, backgroundColor: "rgba(17,19,24,0.18)" }, demoLabel: { position: "absolute", right: 18, bottom: 16, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: "rgba(255,255,255,0.7)" }, demoLabelText: { color: COLORS.ink, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  horizonArtwork: { position: "absolute", width: 182, height: 172, right: -2, bottom: -1 }, sunDisc: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFD88B", right: 18, top: 10, opacity: 0.85 }, cloudOne: { position: "absolute", width: 66, height: 19, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.45)", right: 80, top: 43 }, cloudTwo: { position: "absolute", width: 42, height: 13, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.42)", right: 13, top: 76 }, oceanLineOne: { position: "absolute", height: 58, backgroundColor: "#8ACCEB", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 52 }, oceanLineTwo: { position: "absolute", height: 4, backgroundColor: "rgba(255,255,255,0.55)", left: 10, right: 0, bottom: 44, borderRadius: 4 }, shipHull: { position: "absolute", height: 47, width: 130, backgroundColor: COLORS.surface, right: 0, bottom: 30, borderTopLeftRadius: 18, borderBottomLeftRadius: 46, borderBottomRightRadius: 8, transform: [{ skewX: "-10deg" }] }, shipDeckOne: { position: "absolute", height: 17, width: 92, backgroundColor: "#FDFEFF", right: 21, bottom: 75, borderTopLeftRadius: 11, borderTopRightRadius: 11 }, shipDeckTwo: { position: "absolute", height: 12, width: 63, backgroundColor: "#FDFEFF", right: 39, bottom: 91, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, shipWindowRow: { position: "absolute", flexDirection: "row", gap: 6, right: 28, bottom: 50 }, window: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blueDeep },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 30, marginBottom: 14 }, sectionTitle: { color: COLORS.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.45 }, sectionAction: { color: COLORS.secondary, fontSize: 12, fontWeight: "600" },
  passOverview: { borderRadius: 27, backgroundColor: COLORS.surface, padding: 19, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, passOverviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, iconBubble: { width: 39, height: 39, borderRadius: 15, backgroundColor: COLORS.blueSoft, alignItems: "center", justifyContent: "center" }, paidChip: { flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 20, backgroundColor: COLORS.greenSoft, paddingHorizontal: 10, paddingVertical: 6 }, paidDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green }, paidChipText: { color: COLORS.green, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, passOverviewTitle: { marginTop: 18, color: COLORS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }, passOverviewCopy: { marginTop: 4, color: COLORS.secondary, fontSize: 13, fontWeight: "500" }, dottedRule: { borderTopWidth: 1, borderStyle: "dashed", borderColor: COLORS.line, marginVertical: 16 }, passOverviewFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, passOverviewMeta: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  taskStack: { gap: 10 }, taskCard: { minHeight: 77, borderRadius: 21, backgroundColor: COLORS.surface, paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12 }, taskCheck: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#D5D9DD", alignItems: "center", justifyContent: "center" }, taskCheckDone: { backgroundColor: COLORS.black, borderColor: COLORS.black }, taskBody: { flex: 1 }, taskTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "700" }, taskTitleComplete: { color: COLORS.secondary }, taskCopy: { marginTop: 3, color: COLORS.secondary, fontSize: 11, lineHeight: 15 },
  reminderRow: { flexDirection: "row", gap: 12 }, reminderCard: { flex: 1, minHeight: 178, borderRadius: 25, padding: 15 }, reminderCardBlue: { backgroundColor: COLORS.blue }, reminderCardPink: { backgroundColor: COLORS.pinkSoft }, reminderCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, reminderIcon: { width: 33, height: 33, borderRadius: 16.5, backgroundColor: "rgba(255,255,255,0.72)", alignItems: "center", justifyContent: "center" }, reminderTitle: { marginTop: 22, color: COLORS.ink, fontSize: 15, lineHeight: 19, fontWeight: "800", letterSpacing: -0.25 }, reminderCopy: { marginTop: 6, color: "#39434A", fontSize: 11, lineHeight: 15, fontWeight: "500" },
  eventList: { gap: 10 }, eventCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 21, backgroundColor: COLORS.surface, padding: 13 }, eventDate: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.cream, alignItems: "center", justifyContent: "center" }, eventDateDay: { color: COLORS.ink, fontSize: 13, fontWeight: "800" }, eventDateMonth: { marginTop: 1, color: COLORS.secondary, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 }, eventBody: { flex: 1 }, eventTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "800" }, eventDetail: { marginTop: 3, color: COLORS.secondary, fontSize: 11 }, eventPlace: { marginTop: 2, color: COLORS.blueDeep, fontSize: 11, fontWeight: "700" }, eventArrow: { width: 31, height: 31, borderRadius: 15.5, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center" },
  websiteLink: { marginTop: 22, minHeight: 58, borderRadius: 19, backgroundColor: COLORS.black, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, websiteLinkText: { color: COLORS.surface, fontSize: 14, fontWeight: "700" }, fixtureFooter: { marginTop: 24, flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 6 }, fixtureFooterText: { flex: 1, color: COLORS.secondary, fontSize: 10, lineHeight: 14 },
  largeTripCard: { minHeight: 312, overflow: "hidden", borderRadius: 30, backgroundColor: COLORS.blue, position: "relative", padding: 20, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, tripCardBody: { maxWidth: "72%" }, smallPill: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, smallPillText: { color: COLORS.ink, fontSize: 9, letterSpacing: 0.8, fontWeight: "800", textTransform: "uppercase" }, largeTripTitle: { marginTop: 21, color: COLORS.ink, fontSize: 25, lineHeight: 29, fontWeight: "800", letterSpacing: -0.7 }, largeTripDestination: { marginTop: 6, color: "#385768", fontSize: 14, fontWeight: "600" }, tripDetailsGrid: { gap: 12, marginTop: 22 }, detail: { gap: 3 }, detailLabel: { color: "#58727F", fontSize: 9, letterSpacing: 1.1, fontWeight: "800" }, detailValue: { marginTop: 3, color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  passPageIntro: { paddingTop: 7, paddingBottom: 20 }, eyebrow: { color: COLORS.pink, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, passPageTitle: { marginTop: 9, color: COLORS.ink, fontSize: 29, lineHeight: 33, letterSpacing: -0.9, fontWeight: "800" }, passPageCopy: { marginTop: 11, maxWidth: 330, color: COLORS.secondary, fontSize: 13, lineHeight: 19 }, qrCard: { borderRadius: 30, backgroundColor: COLORS.surface, padding: 20, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 3 }, qrCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, qrCardName: { color: COLORS.ink, fontSize: 18, fontWeight: "800" }, qrCardSub: { marginTop: 3, color: COLORS.secondary, fontSize: 11 }, verifiedMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" }, qrCanvas: { alignSelf: "center", marginTop: 23, padding: 15, borderRadius: 21, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line }, qrPlaceholder: { height: 220, alignItems: "center", justifyContent: "center", gap: 12 }, qrExpires: { marginTop: 15, color: COLORS.secondary, fontSize: 11, textAlign: "center" }, qrFooter: { marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, qrFooterItem: { flexDirection: "row", alignItems: "center", gap: 8 }, qrFooterText: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  guideHero: { marginTop: 6, borderRadius: 30, backgroundColor: COLORS.cream, padding: 22 }, guideTitle: { marginTop: 9, color: COLORS.ink, fontSize: 29, lineHeight: 33, letterSpacing: -0.8, fontWeight: "800" }, guideCopy: { marginTop: 11, color: "#6F6146", fontSize: 13, lineHeight: 19, maxWidth: 300 },
  profileHero: { alignItems: "center", paddingTop: 12, paddingBottom: 24 }, profileAvatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" }, profileAvatarText: { color: COLORS.ink, fontSize: 30, fontWeight: "800" }, profileName: { marginTop: 13, color: COLORS.ink, fontSize: 23, fontWeight: "800" }, profileEmail: { marginTop: 4, color: COLORS.secondary, fontSize: 12 }, profileMenu: { borderRadius: 26, backgroundColor: COLORS.surface, overflow: "hidden" }, profileRow: { minHeight: 80, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line }, profileRowIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center" }, profileRowBody: { flex: 1 }, profileRowLabel: { color: COLORS.ink, fontSize: 14, fontWeight: "700" }, profileRowSub: { marginTop: 3, color: COLORS.secondary, fontSize: 11, lineHeight: 15 },
  infoPanel: { flexDirection: "row", alignItems: "flex-start", gap: 13, padding: 17, borderRadius: 24 }, infoBlue: { backgroundColor: COLORS.blueSoft }, infoPink: { backgroundColor: COLORS.pinkSoft }, infoDark: { backgroundColor: COLORS.black }, infoPanelIcon: { width: 39, height: 39, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" }, infoPanelIconDark: { backgroundColor: "#292C33" }, infoPanelBody: { flex: 1 }, infoPanelTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "800" }, infoPanelCopy: { marginTop: 4, color: "#5B6169", fontSize: 12, lineHeight: 17 }, infoDarkText: { color: "#F6F7F8" },
  loadingState: { minHeight: 500, alignItems: "center", justifyContent: "center" }, loadingTitle: { marginTop: 18, color: COLORS.ink, fontSize: 17, fontWeight: "800" }, loadingCopy: { marginTop: 5, color: COLORS.secondary, fontSize: 12 }, connectionState: { marginTop: 70, alignItems: "center", borderRadius: 30, backgroundColor: COLORS.surface, padding: 24, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, connectionIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.blueSoft, alignItems: "center", justifyContent: "center" }, connectionTitle: { marginTop: 18, color: COLORS.ink, fontSize: 23, lineHeight: 27, textAlign: "center", fontWeight: "800" }, connectionCopy: { marginTop: 9, color: COLORS.secondary, fontSize: 13, lineHeight: 19, textAlign: "center" }, retryButton: { marginTop: 20, minHeight: 48, borderRadius: 16, backgroundColor: COLORS.black, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }, retryButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: "800" },
  tabDock: { position: "absolute", left: 18, right: 18, bottom: 14, minHeight: 68, borderRadius: 25, backgroundColor: COLORS.surface, paddingHorizontal: 5, paddingVertical: 7, flexDirection: "row", shadowColor: "#80878E", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 9 }, tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }, tabIconWrap: { width: 31, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" }, tabIconWrapActive: { backgroundColor: COLORS.black }, tabLabel: { color: COLORS.secondary, fontSize: 9, fontWeight: "600" }, tabLabelActive: { color: COLORS.ink, fontWeight: "800" }, pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});

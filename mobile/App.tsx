import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import QRCode from "react-native-qrcode-svg";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { createDevelopmentInvitation, getGuestExperience, getGuestQrCredential, isApiConfigured, updateDevelopmentChecklist, type ChecklistTask, type DevelopmentGuestKey, type DevelopmentInvitation, type GuestExperience, type GuestQrCredential } from "./src/api/client";

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
  const { width } = useWindowDimensions();
  const usePhonePreviewFrame = Platform.OS === "web" && width > 460;
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [experience, setExperience] = useState<GuestExperience | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<GuestQrCredential | null>(null);
  const [guestKey, setGuestKey] = useState<DevelopmentGuestKey>("aurora");
  const [checklist, setChecklist] = useState<ChecklistTask[]>([]);
  const [invitation, setInvitation] = useState<DevelopmentInvitation | null>(null);

  const loadExperience = (selectedGuest = guestKey) => {
    setLoading(true);
    setError(null);
    getGuestExperience(selectedGuest)
      .then((nextExperience) => { setExperience(nextExperience); setChecklist(nextExperience.checklist); setInvitation(null); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "We could not load this BGC experience."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExperience(); }, [guestKey]);
  useEffect(() => {
    if (activeTab !== "pass" || !experience) return;
    getGuestQrCredential(guestKey).then(setCredential).catch(() => setCredential(null));
  }, [activeTab, experience, guestKey]);

  const toggleChecklistTask = async (task: ChecklistTask) => {
    const nextValue = !task.completed;
    setChecklist((previous) => previous.map((item) => item.id === task.id ? { ...item, completed: nextValue } : item));
    try {
      const response = await updateDevelopmentChecklist(guestKey, task.id, nextValue);
      setChecklist(response.checklist);
    } catch {
      setChecklist((previous) => previous.map((item) => item.id === task.id ? { ...item, completed: task.completed } : item));
    }
  };

  const createInvite = async () => {
    try { setInvitation(await createDevelopmentInvitation(guestKey)); } catch { setInvitation(null); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, usePhonePreviewFrame && styles.safeAreaWebPreview]}>
      <StatusBar style="dark" />
      <View style={[styles.appShell, usePhonePreviewFrame && styles.appShellWebPreview]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? <LoadingState /> : error || !experience ? <ConnectionState error={error} onRetry={() => loadExperience()} /> : <>
            <PageHeader activeTab={activeTab} guestName={experience.guest.displayName} />
            {activeTab === "home" && <Home experience={experience} checklist={checklist} invitation={invitation} onToggleTask={toggleChecklistTask} onCreateInvite={createInvite} onOpenWebsite={() => Linking.openURL(experience.externalLinks.website)} />}
            {activeTab === "cruises" && <Cruises experience={experience} />}
            {activeTab === "pass" && <Pass experience={experience} credential={credential} />}
            {activeTab === "guide" && <Guide experience={experience} />}
            {activeTab === "profile" && <Profile experience={experience} guestKey={guestKey} onSelectGuest={setGuestKey} />}
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

function Home({ experience, checklist, invitation, onToggleTask, onCreateInvite, onOpenWebsite }: { experience: GuestExperience; checklist: ChecklistTask[]; invitation: DevelopmentInvitation | null; onToggleTask: (task: ChecklistTask) => void; onCreateInvite: () => void; onOpenWebsite: () => void }) {
  const cruise = experience.upcomingCruise;
  return <>
    <HeroCard experience={{ ...experience, checklist }} />
    <SectionHeader title="Your cruise at a glance" action="View trip" />
    <View style={styles.passOverview}>
      <View style={styles.passOverviewTop}><View style={styles.iconBubble}><Ionicons name="ticket-outline" size={20} color={COLORS.ink} /></View><View style={[styles.paidChip, experience.pass.status === "unpaid" && styles.unpaidChip]}><View style={[styles.paidDot, experience.pass.status === "unpaid" && styles.unpaidDot]} /><Text style={[styles.paidChipText, experience.pass.status === "unpaid" && styles.unpaidChipText]}>{experience.pass.label}</Text></View></View>
      <Text style={styles.passOverviewTitle}>BGC Pass</Text>
      <Text style={styles.passOverviewCopy}>{cruise.destination} · {formatDate(cruise.departureDate)}</Text>
      <View style={styles.dottedRule} />
      <View style={styles.passOverviewFooter}><Text style={styles.passOverviewMeta}>{experience.pass.status === "paid" ? "Boarding credentials ready" : "Payment action needed"}</Text><Ionicons name="arrow-forward" size={19} color={COLORS.ink} /></View>
    </View>
    <SectionHeader title="A few things left" action={`${checklist.filter((item) => !item.completed).length} pending`} />
    <View style={styles.taskStack}>{checklist.map((task) => <TaskCard key={task.id} task={task} onPress={() => onToggleTask(task)} />)}</View>
    <SectionHeader title="Finish the good stuff" action="Add-ons" />
    <View style={styles.addOnStack}>{experience.addOns.map((addOn) => <AddOnCard key={addOn.id} addOn={addOn} />)}</View>
    <SectionHeader title="Worth a look" action="Today" />
    <View style={styles.reminderRow}>{experience.reminders.map((reminder, index) => <ReminderCard key={reminder.id} reminder={reminder} index={index} onPress={reminder.action === "invite" ? onCreateInvite : reminder.action === "next_cruise" ? onOpenWebsite : undefined} />)}</View>
    {invitation ? <View style={styles.inviteSuccess}><Ionicons name="checkmark-circle" size={20} color={COLORS.green} /><View style={styles.inviteSuccessBody}><Text style={styles.inviteSuccessTitle}>Development invite ready</Text><Text style={styles.inviteSuccessCopy}>{invitation.message}</Text><Text selectable style={styles.inviteSuccessUrl}>{invitation.inviteUrl}</Text></View></View> : null}
    <SectionHeader title="Onboard moments" action="Cruise guide" />
    <View style={styles.eventList}>{experience.events.map((event) => <EventCard key={event.id} event={event} />)}</View>
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
    <SectionHeader title="Your cruise history" action={`${experience.guest.completedCruiseCount} complete`} />
    {experience.history.length ? <View style={styles.historyStack}>{experience.history.map((trip) => <View key={trip.id} style={styles.historyCard}><View style={styles.historyYear}><Text style={styles.historyYearText}>{trip.year}</Text></View><View style={styles.historyBody}><Text style={styles.historyName}>{trip.name}</Text><Text style={styles.historyDestination}>{trip.destination}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.secondary} /></View>)}</View> : <InfoPanel icon="boat-outline" title="Your first BGC story starts here." copy="This synthetic guest has no past sailings yet, so the current cruise will become their first history card." tone="blue" />}
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Pass({ experience, credential }: { experience: GuestExperience; credential: GuestQrCredential | null }) {
  const paid = experience.pass.status === "paid";
  return <>
    <View style={styles.passPageIntro}><Text style={styles.eyebrow}>YOUR ACCESS</Text><Text style={styles.passPageTitle}>Your BGC pass,{"\n"}always with you.</Text><Text style={styles.passPageCopy}>Show this live pass to BGC staff once onboard. Your cruise relationship and pass status are verified on the server.</Text></View>
    <View style={styles.qrCard}><View style={styles.qrCardHeader}><View><Text style={styles.qrCardName}>{experience.guest.displayName}</Text><Text style={styles.qrCardSub}>BGC guest credential</Text></View><View style={[styles.verifiedMark, !paid && styles.unpaidMark]}><Ionicons name={paid ? "checkmark" : "alert"} size={17} color={COLORS.surface} /></View></View>{credential ? <><View style={styles.qrCanvas}><QRCode value={credential.token} size={190} color={COLORS.ink} backgroundColor={COLORS.surface} /></View><Text style={styles.qrExpires}>Secure demo credential · refreshes at {formatTime(credential.expiresAt)}</Text></> : <View style={styles.qrPlaceholder}><ActivityIndicator color={COLORS.ink} /><Text style={styles.qrExpires}>Refreshing your secure pass…</Text></View>}<View style={styles.qrFooter}><View style={styles.qrFooterItem}><Ionicons name={paid ? "shield-checkmark-outline" : "alert-circle-outline"} size={17} color={COLORS.ink} /><Text style={styles.qrFooterText}>Pass {experience.pass.label.toLowerCase()}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.ink} /></View></View>
    <InfoPanel icon={paid ? "scan-outline" : "card-outline"} title={paid ? "Live, not static." : "Payment is needed."} copy={paid ? "The QR expires quickly and is checked against BGC’s source on every scan. A screenshot cannot act as an authoritative pass." : "This synthetic profile intentionally models an unpaid BGC pass. Staff scanner validation will reject it."} tone={paid ? "dark" : "pink"} />
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Guide({ experience }: { experience: GuestExperience }) {
  return <>
    <View style={styles.guideHero}><Text style={styles.eyebrow}>CRUISE GUIDE</Text><Text style={styles.guideTitle}>The right place,{"\n"}right on time.</Text><Text style={styles.guideCopy}>Your essentials, BGC moments, and timely reminders in one calm place.</Text></View>
    <SectionHeader title="Coming up" action="Onboard" />
    <View style={styles.eventList}>{experience.events.map((event) => <EventCard key={event.id} event={event} />)}</View>
    <SectionHeader title="Future escapes" action="Website" />
    <Pressable onPress={() => Linking.openURL(experience.nextCruise.websiteUrl)} style={({ pressed }) => [pressed && styles.pressed]}><InfoPanel icon="people-outline" title={experience.nextCruise.title} copy={experience.nextCruise.detail} tone="pink" /></Pressable>
    <SectionHeader title="Help & FAQs" action={`${experience.faq.length} answers`} />
    <View style={styles.faqStack}>{experience.faq.map((item) => <View key={item.id} style={styles.faqCard}><Text style={styles.faqQuestion}>{item.question}</Text><Text style={styles.faqAnswer}>{item.answer}</Text></View>)}</View>
    <FixtureFooter notice={experience.notice} />
  </>;
}

function Profile({ experience, guestKey, onSelectGuest }: { experience: GuestExperience; guestKey: DevelopmentGuestKey; onSelectGuest: (value: DevelopmentGuestKey) => void }) {
  return <>
    <View style={styles.profileIdentity}><View style={styles.profileAvatarCompact}><Ionicons name="person" size={20} color={COLORS.ink} /></View><View style={styles.profileIdentityBody}><Text style={styles.profileName}>{experience.guest.displayName}</Text><Text style={styles.profileEmail}>{experience.guest.accountStatus}</Text><Text style={styles.profileMeta}>{experience.guest.completedCruiseCount} BGC cruise{experience.guest.completedCruiseCount === 1 ? "" : "s"} completed</Text></View></View>
    <Text style={styles.profileSectionLabel}>DEVELOPMENT GUEST SCENARIOS</Text>
    <View style={styles.guestSwitcher}>{experience.availableGuests.map((guest) => <Pressable key={guest.key} onPress={() => onSelectGuest(guest.key)} style={({ pressed }) => [styles.guestSwitchOption, guestKey === guest.key && styles.guestSwitchOptionActive, pressed && styles.pressed]}><Text style={[styles.guestSwitchName, guestKey === guest.key && styles.guestSwitchNameActive]}>{guest.displayName}</Text><Text style={[styles.guestSwitchState, guestKey === guest.key && styles.guestSwitchStateActive]}>{guest.state}</Text></Pressable>)}</View>
    <View style={styles.profileMenu}><ProfileRow icon="notifications-outline" label="Notification preferences" sublabel="Cruise reminders and BGC updates" /><Pressable onPress={() => Linking.openURL(experience.externalLinks.website)}><ProfileRow icon="globe-outline" label="BGC website" sublabel="Open the current booking and marketing site" /></Pressable><Pressable onPress={() => Linking.openURL(experience.externalLinks.instagram)}><ProfileRow icon="logo-instagram" label="BGC on Instagram" sublabel="Open the public social profile" /></Pressable><ProfileRow icon="information-circle-outline" label="Development environment" sublabel={`Synthetic guest ID · ${experience.guest.developmentId}`} /></View>
    <FixtureFooter notice={experience.notice} />
  </>;
}

function TaskCard({ task, onPress }: { task: ChecklistTask; onPress: () => void }) { return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed }} onPress={onPress} style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}><View style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>{task.completed ? <Ionicons name="checkmark" size={15} color={COLORS.surface} /> : null}</View><View style={styles.taskBody}><Text style={[styles.taskTitle, task.completed && styles.taskTitleComplete]}>{task.title}</Text><Text style={styles.taskCopy}>{task.detail}</Text></View><Ionicons name={task.completed ? "checkmark-circle" : "chevron-forward"} size={18} color={task.completed ? COLORS.green : COLORS.secondary} /></Pressable>; }
function AddOnCard({ addOn }: { addOn: GuestExperience["addOns"][number] }) { const icon: IconName = addOn.kind === "drink_package" ? "wine-outline" : addOn.kind === "bgc_pass" ? "ticket-outline" : addOn.kind === "beach_club" ? "sunny-outline" : "bed-outline"; const complete = addOn.status === "complete"; return <View style={styles.addOnCard}><View style={styles.addOnIcon}><Ionicons name={icon} size={18} color={COLORS.ink} /></View><View style={styles.addOnBody}><Text style={styles.addOnTitle}>{addOn.title}</Text><Text style={styles.addOnDetail}>{addOn.detail}</Text></View><View style={[styles.addOnStatus, complete ? styles.addOnStatusComplete : addOn.status === "needed" ? styles.addOnStatusNeeded : styles.addOnStatusAvailable]}><Text style={styles.addOnStatusText}>{complete ? "Ready" : addOn.status === "needed" ? "Needed" : "Available"}</Text></View></View>; }
function ReminderCard({ reminder, index, onPress }: { reminder: GuestExperience["reminders"][number]; index: number; onPress?: () => void }) { const isBlue = index % 2 === 0; return <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.reminderCard, isBlue ? styles.reminderCardBlue : styles.reminderCardPink, pressed && styles.pressed]}><View style={styles.reminderCardTop}><View style={styles.reminderIcon}><Ionicons name={reminder.action === "invite" ? "people-outline" : reminder.action === "add_ons" ? "sparkles-outline" : "heart-outline"} size={17} color={COLORS.ink} /></View><Ionicons name="arrow-up-right-box" size={17} color={COLORS.ink} /></View><Text style={styles.reminderTitle}>{reminder.title}</Text><Text style={styles.reminderCopy}>{reminder.detail}</Text></Pressable>; }
function EventCard({ event }: { event: GuestExperience["events"][number] }) { return <View style={styles.eventCard}><View style={styles.eventMarker}><Ionicons name="calendar-clear-outline" size={19} color={COLORS.ink} /></View><View style={styles.eventBody}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventDetail}>{event.timing}</Text><Text style={styles.eventPlace}>{event.location}</Text></View><View style={styles.eventArrow}><Ionicons name="arrow-forward" size={16} color={COLORS.ink} /></View></View>; }
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
  safeArea: { flex: 1, backgroundColor: COLORS.canvas }, safeAreaWebPreview: { alignItems: "center", backgroundColor: "#E7EBEF", paddingVertical: 20 }, appShell: { flex: 1, backgroundColor: COLORS.canvas, width: "100%" }, appShellWebPreview: { width: 430, maxWidth: "100%", borderRadius: 34, overflow: "hidden", shadowColor: "#5E6670", shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.22, shadowRadius: 34, elevation: 10 }, content: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 126 },
  topBar: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, greeting: { color: COLORS.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.7 }, wave: { fontSize: 21 }, welcomeBack: { marginTop: 4, color: COLORS.secondary, fontSize: 13, fontWeight: "500" }, pageTitle: { color: COLORS.ink, fontSize: 27, fontWeight: "800", letterSpacing: -0.8 }, roundButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.surface, alignItems: "center", justifyContent: "center", shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.17, shadowRadius: 18, elevation: 3 }, logoDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.black, alignItems: "center", justifyContent: "center" }, logoDotText: { color: COLORS.surface, fontSize: 17, fontWeight: "900" },
  heroCard: { height: 276, overflow: "hidden", borderRadius: 30, backgroundColor: COLORS.blue, padding: 20, position: "relative", shadowColor: "#9AA4AD", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 4 }, heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, dotMenu: { flexDirection: "row", gap: 4 }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.ink }, heroArrow: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" }, heroContent: { marginTop: 32, maxWidth: "75%" }, heroEyebrow: { color: COLORS.ink, fontSize: 10, fontWeight: "800", letterSpacing: 1.25 }, heroTitle: { marginTop: 7, color: COLORS.ink, fontSize: 30, lineHeight: 33, fontWeight: "800", letterSpacing: -1 }, heroCopy: { marginTop: 7, color: "#31404A", fontSize: 13, lineHeight: 18, fontWeight: "500" }, heroStats: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 20 }, heroStatValue: { color: COLORS.ink, fontSize: 16, fontWeight: "800" }, heroStatLabel: { marginTop: 2, color: "#45606E", fontSize: 8, fontWeight: "800", letterSpacing: 1 }, heroDivider: { height: 26, width: 1, backgroundColor: "rgba(17,19,24,0.18)" }, demoLabel: { position: "absolute", right: 18, bottom: 16, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, backgroundColor: "rgba(255,255,255,0.7)" }, demoLabelText: { color: COLORS.ink, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  horizonArtwork: { position: "absolute", width: 182, height: 172, right: -2, bottom: -1 }, sunDisc: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "#FFD88B", right: 18, top: 10, opacity: 0.85 }, cloudOne: { position: "absolute", width: 66, height: 19, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.45)", right: 80, top: 43 }, cloudTwo: { position: "absolute", width: 42, height: 13, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.42)", right: 13, top: 76 }, oceanLineOne: { position: "absolute", height: 58, backgroundColor: "#8ACCEB", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 52 }, oceanLineTwo: { position: "absolute", height: 4, backgroundColor: "rgba(255,255,255,0.55)", left: 10, right: 0, bottom: 44, borderRadius: 4 }, shipHull: { position: "absolute", height: 47, width: 130, backgroundColor: COLORS.surface, right: 0, bottom: 30, borderTopLeftRadius: 18, borderBottomLeftRadius: 46, borderBottomRightRadius: 8, transform: [{ skewX: "-10deg" }] }, shipDeckOne: { position: "absolute", height: 17, width: 92, backgroundColor: "#FDFEFF", right: 21, bottom: 75, borderTopLeftRadius: 11, borderTopRightRadius: 11 }, shipDeckTwo: { position: "absolute", height: 12, width: 63, backgroundColor: "#FDFEFF", right: 39, bottom: 91, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, shipWindowRow: { position: "absolute", flexDirection: "row", gap: 6, right: 28, bottom: 50 }, window: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.blueDeep },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 30, marginBottom: 14 }, sectionTitle: { color: COLORS.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.45 }, sectionAction: { color: COLORS.secondary, fontSize: 12, fontWeight: "600" },
  passOverview: { borderRadius: 27, backgroundColor: COLORS.surface, padding: 19, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, passOverviewTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, iconBubble: { width: 39, height: 39, borderRadius: 15, backgroundColor: COLORS.blueSoft, alignItems: "center", justifyContent: "center" }, paidChip: { flexDirection: "row", gap: 6, alignItems: "center", borderRadius: 20, backgroundColor: COLORS.greenSoft, paddingHorizontal: 10, paddingVertical: 6 }, unpaidChip: { backgroundColor: COLORS.pinkSoft }, paidDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green }, unpaidDot: { backgroundColor: COLORS.pink }, paidChipText: { color: COLORS.green, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, unpaidChipText: { color: "#B94B70" }, passOverviewTitle: { marginTop: 18, color: COLORS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }, passOverviewCopy: { marginTop: 4, color: COLORS.secondary, fontSize: 13, fontWeight: "500" }, dottedRule: { borderTopWidth: 1, borderStyle: "dashed", borderColor: COLORS.line, marginVertical: 16 }, passOverviewFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, passOverviewMeta: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  taskStack: { gap: 10 }, taskCard: { minHeight: 77, borderRadius: 21, backgroundColor: COLORS.surface, paddingHorizontal: 15, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12 }, taskCheck: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: "#D5D9DD", alignItems: "center", justifyContent: "center" }, taskCheckDone: { backgroundColor: COLORS.black, borderColor: COLORS.black }, taskBody: { flex: 1 }, taskTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "700" }, taskTitleComplete: { color: COLORS.secondary }, taskCopy: { marginTop: 3, color: COLORS.secondary, fontSize: 11, lineHeight: 15 },
  addOnStack: { gap: 9 }, addOnCard: { minHeight: 70, borderRadius: 21, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11 }, addOnIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: COLORS.cream, alignItems: "center", justifyContent: "center" }, addOnBody: { flex: 1 }, addOnTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "800" }, addOnDetail: { marginTop: 3, color: COLORS.secondary, fontSize: 10, lineHeight: 14 }, addOnStatus: { borderRadius: 14, paddingHorizontal: 8, paddingVertical: 5 }, addOnStatusComplete: { backgroundColor: COLORS.greenSoft }, addOnStatusNeeded: { backgroundColor: COLORS.pinkSoft }, addOnStatusAvailable: { backgroundColor: COLORS.blueSoft }, addOnStatusText: { color: COLORS.ink, fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  reminderRow: { gap: 12 }, reminderCard: { minHeight: 142, borderRadius: 25, padding: 17 }, reminderCardBlue: { backgroundColor: COLORS.blue }, reminderCardPink: { backgroundColor: COLORS.pinkSoft }, reminderCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, reminderIcon: { width: 33, height: 33, borderRadius: 16.5, backgroundColor: "rgba(255,255,255,0.72)", alignItems: "center", justifyContent: "center" }, reminderTitle: { marginTop: 17, color: COLORS.ink, fontSize: 16, lineHeight: 20, fontWeight: "800", letterSpacing: -0.25 }, reminderCopy: { marginTop: 5, color: "#39434A", fontSize: 12, lineHeight: 16, fontWeight: "500" }, inviteSuccess: { marginTop: 12, borderRadius: 20, padding: 14, flexDirection: "row", gap: 10, backgroundColor: COLORS.greenSoft }, inviteSuccessBody: { flex: 1 }, inviteSuccessTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "800" }, inviteSuccessCopy: { marginTop: 3, color: "#3B6659", fontSize: 11, lineHeight: 15 }, inviteSuccessUrl: { marginTop: 5, color: COLORS.green, fontSize: 10, fontWeight: "700" },
  eventList: { gap: 10 }, eventCard: { minHeight: 88, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 21, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 14 }, eventMarker: { width: 44, height: 44, borderRadius: 15, backgroundColor: COLORS.cream, alignItems: "center", justifyContent: "center", flexShrink: 0 }, eventBody: { flex: 1, flexShrink: 1 }, eventTitle: { color: COLORS.ink, fontSize: 14, lineHeight: 18, fontWeight: "800" }, eventDetail: { marginTop: 3, color: COLORS.secondary, fontSize: 11, lineHeight: 15 }, eventPlace: { marginTop: 2, color: COLORS.blueDeep, fontSize: 11, lineHeight: 15, fontWeight: "700" }, eventArrow: { width: 31, height: 31, borderRadius: 15.5, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  websiteLink: { marginTop: 22, minHeight: 58, borderRadius: 19, backgroundColor: COLORS.black, paddingHorizontal: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, websiteLinkText: { color: COLORS.surface, fontSize: 14, fontWeight: "700" }, fixtureFooter: { marginTop: 24, flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 6 }, fixtureFooterText: { flex: 1, color: COLORS.secondary, fontSize: 10, lineHeight: 14 },
  largeTripCard: { minHeight: 312, overflow: "hidden", borderRadius: 30, backgroundColor: COLORS.blue, position: "relative", padding: 20, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, tripCardBody: { maxWidth: "72%" }, smallPill: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 }, smallPillText: { color: COLORS.ink, fontSize: 9, letterSpacing: 0.8, fontWeight: "800", textTransform: "uppercase" }, largeTripTitle: { marginTop: 21, color: COLORS.ink, fontSize: 25, lineHeight: 29, fontWeight: "800", letterSpacing: -0.7 }, largeTripDestination: { marginTop: 6, color: "#385768", fontSize: 14, fontWeight: "600" }, tripDetailsGrid: { gap: 12, marginTop: 22 }, detail: { gap: 3 }, detailLabel: { color: "#58727F", fontSize: 9, letterSpacing: 1.1, fontWeight: "800" }, detailValue: { marginTop: 3, color: COLORS.ink, fontSize: 13, fontWeight: "700" }, historyStack: { gap: 10 }, historyCard: { minHeight: 72, borderRadius: 21, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 }, historyYear: { width: 45, height: 45, borderRadius: 15, backgroundColor: COLORS.pinkSoft, alignItems: "center", justifyContent: "center" }, historyYearText: { color: COLORS.ink, fontSize: 11, fontWeight: "900" }, historyBody: { flex: 1 }, historyName: { color: COLORS.ink, fontSize: 14, fontWeight: "800" }, historyDestination: { marginTop: 3, color: COLORS.secondary, fontSize: 11 },
  passPageIntro: { paddingTop: 7, paddingBottom: 20 }, eyebrow: { color: COLORS.pink, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, passPageTitle: { marginTop: 9, color: COLORS.ink, fontSize: 29, lineHeight: 33, letterSpacing: -0.9, fontWeight: "800" }, passPageCopy: { marginTop: 11, maxWidth: 330, color: COLORS.secondary, fontSize: 13, lineHeight: 19 }, qrCard: { borderRadius: 30, backgroundColor: COLORS.surface, padding: 20, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 3 }, qrCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, qrCardName: { color: COLORS.ink, fontSize: 18, fontWeight: "800" }, qrCardSub: { marginTop: 3, color: COLORS.secondary, fontSize: 11 }, verifiedMark: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.green, alignItems: "center", justifyContent: "center" }, unpaidMark: { backgroundColor: COLORS.pink }, qrCanvas: { alignSelf: "center", marginTop: 23, padding: 15, borderRadius: 21, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line }, qrPlaceholder: { height: 220, alignItems: "center", justifyContent: "center", gap: 12 }, qrExpires: { marginTop: 15, color: COLORS.secondary, fontSize: 11, textAlign: "center" }, qrFooter: { marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderColor: COLORS.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, qrFooterItem: { flexDirection: "row", alignItems: "center", gap: 8 }, qrFooterText: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  guideHero: { marginTop: 6, borderRadius: 30, backgroundColor: COLORS.cream, padding: 22 }, guideTitle: { marginTop: 9, color: COLORS.ink, fontSize: 29, lineHeight: 33, letterSpacing: -0.8, fontWeight: "800" }, guideCopy: { marginTop: 11, color: "#6F6146", fontSize: 13, lineHeight: 19, maxWidth: 300 }, faqStack: { gap: 9 }, faqCard: { borderRadius: 20, backgroundColor: COLORS.surface, padding: 15 }, faqQuestion: { color: COLORS.ink, fontSize: 13, lineHeight: 18, fontWeight: "800" }, faqAnswer: { marginTop: 6, color: COLORS.secondary, fontSize: 11, lineHeight: 16 },
  profileIdentity: { flexDirection: "row", alignItems: "center", gap: 13, paddingTop: 8, paddingBottom: 23 }, profileAvatarCompact: { width: 52, height: 52, borderRadius: 18, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" }, profileIdentityBody: { flex: 1 }, profileName: { color: COLORS.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.45 }, profileEmail: { marginTop: 3, color: COLORS.secondary, fontSize: 12 }, profileMeta: { marginTop: 5, color: COLORS.blueDeep, fontSize: 11, fontWeight: "700" }, profileSectionLabel: { marginBottom: 8, color: COLORS.secondary, fontSize: 9, fontWeight: "800", letterSpacing: 1.1 }, guestSwitcher: { gap: 8, marginBottom: 18 }, guestSwitchOption: { minHeight: 56, borderRadius: 18, backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 11 }, guestSwitchOptionActive: { backgroundColor: COLORS.blue }, guestSwitchName: { color: COLORS.ink, fontSize: 13, fontWeight: "800" }, guestSwitchNameActive: { color: COLORS.ink }, guestSwitchState: { marginTop: 3, color: COLORS.secondary, fontSize: 10 }, guestSwitchStateActive: { color: "#385768" }, profileMenu: { borderRadius: 26, backgroundColor: COLORS.surface, overflow: "hidden" }, profileRow: { minHeight: 80, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line }, profileRowIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: COLORS.canvas, alignItems: "center", justifyContent: "center" }, profileRowBody: { flex: 1 }, profileRowLabel: { color: COLORS.ink, fontSize: 14, fontWeight: "700" }, profileRowSub: { marginTop: 3, color: COLORS.secondary, fontSize: 11, lineHeight: 15 },
  infoPanel: { flexDirection: "row", alignItems: "flex-start", gap: 13, padding: 17, borderRadius: 24 }, infoBlue: { backgroundColor: COLORS.blueSoft }, infoPink: { backgroundColor: COLORS.pinkSoft }, infoDark: { backgroundColor: COLORS.black }, infoPanelIcon: { width: 39, height: 39, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" }, infoPanelIconDark: { backgroundColor: "#292C33" }, infoPanelBody: { flex: 1 }, infoPanelTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "800" }, infoPanelCopy: { marginTop: 4, color: "#5B6169", fontSize: 12, lineHeight: 17 }, infoDarkText: { color: "#F6F7F8" },
  loadingState: { minHeight: 500, alignItems: "center", justifyContent: "center" }, loadingTitle: { marginTop: 18, color: COLORS.ink, fontSize: 17, fontWeight: "800" }, loadingCopy: { marginTop: 5, color: COLORS.secondary, fontSize: 12 }, connectionState: { marginTop: 70, alignItems: "center", borderRadius: 30, backgroundColor: COLORS.surface, padding: 24, shadowColor: "#B6BEC6", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 22, elevation: 3 }, connectionIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.blueSoft, alignItems: "center", justifyContent: "center" }, connectionTitle: { marginTop: 18, color: COLORS.ink, fontSize: 23, lineHeight: 27, textAlign: "center", fontWeight: "800" }, connectionCopy: { marginTop: 9, color: COLORS.secondary, fontSize: 13, lineHeight: 19, textAlign: "center" }, retryButton: { marginTop: 20, minHeight: 48, borderRadius: 16, backgroundColor: COLORS.black, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center" }, retryButtonText: { color: COLORS.surface, fontSize: 13, fontWeight: "800" },
  tabDock: { position: "absolute", left: 18, right: 18, bottom: 14, minHeight: 68, borderRadius: 25, backgroundColor: COLORS.surface, paddingHorizontal: 5, paddingVertical: 7, flexDirection: "row", shadowColor: "#80878E", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 9 }, tabButton: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }, tabIconWrap: { width: 31, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center" }, tabIconWrapActive: { backgroundColor: COLORS.black }, tabLabel: { color: COLORS.secondary, fontSize: 9, fontWeight: "600" }, tabLabelActive: { color: COLORS.ink, fontWeight: "800" }, pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});

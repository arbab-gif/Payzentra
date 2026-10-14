import { ReceiptText } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { AppPage } from "@/components/AppPage";
import { SectionError, TxnRow } from "@/components/home/parts";
import { Loading } from "@/components/Screen";
import { StatusIcon, Text } from "@/components/ui";
import { activeHome, newHome, type Txn } from "@/lib/demoData";
import { usePreview, useSeed } from "@/lib/preview";
import { ROUTES, useApp } from "@/lib/store";
import { fonts, radius, useColors } from "@/lib/theme";
import { useGuard } from "@/lib/useGuard";

type Filter = "all" | "in" | "out" | "pending";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Money in" },
  { key: "out", label: "Money out" },
  { key: "pending", label: "In progress" },
];

const matches = (t: Txn, f: Filter) => (f === "all" ? true : f === "pending" ? t.status === "Processing" : t.direction === f);

/** Every payment, transfer, bill and trade, newest first and grouped by day. */
export default function Activity() {
  const c = useColors();
  const allowed = useGuard(ROUTES.activity);
  const kyc = useApp((s) => s.kyc);
  const scenario = useApp((s) => s.scenarios.home);
  const hide = useApp((s) => s.hideBalances);
  const preview = !!usePreview();
  const seed = useSeed<{ filter: Filter; loading: boolean }>();
  const [filter, setFilter] = useState<Filter>(seed.filter ?? "all");
  const [loading, setLoading] = useState(seed.loading ?? !preview);

  useEffect(() => {
    if (!loading || preview) return;
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [loading, preview]);

  if (!allowed) return <Loading />;

  const verified = kyc.status === "verified";
  const failing = verified && scenario === "unavailable";
  const list = (verified && scenario !== "new" ? activeHome : newHome).activity;
  const shown = list.filter((t) => matches(t, filter));
  const days = [...new Set(shown.map((t) => t.day))];

  return (
    <AppPage page="activity" title="Activity" subtitle="Payments, transfers, bills and trades">
      {/* Filters */}
      {list.length > 0 && !failing && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }} accessibilityRole="radiogroup">
          {FILTERS.map((f) => {
            const on = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: on ? c.inverse : c.surface2, opacity: pressed ? 0.7 : 1 })}
              >
                <Text variant="small" style={{ color: on ? c.onInverse : c.text, fontFamily: fonts.semibold }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {loading ? (
        <ListSkeleton />
      ) : failing ? (
        <View style={{ backgroundColor: c.surface, borderRadius: radius.lg }}>
          <SectionError what="your activity" onRetry={() => setLoading(true)} />
        </View>
      ) : !list.length ? (
        <View style={{ alignItems: "center", paddingHorizontal: 24, paddingVertical: 40, gap: 8, backgroundColor: c.surface, borderRadius: radius.lg }}>
          <StatusIcon icon={ReceiptText} tone="primary" size={64} />
          <Text variant="bodyStrong" style={{ marginTop: 4 }}>No activity yet</Text>
          <Text variant="small" tone="muted" center style={{ maxWidth: 300 }}>
            {verified ? "Add money to make your first payment, transfer or trade. It'll show up here." : "Your payments and transfers will show up here once your wallet is active."}
          </Text>
        </View>
      ) : !shown.length ? (
        <Text tone="muted" center style={{ paddingVertical: 32 }}>Nothing here for this filter.</Text>
      ) : (
        days.map((day) => (
          <View key={day} style={{ marginBottom: 20 }}>
            <Text variant="caption" tone="muted" style={{ marginBottom: 8, marginLeft: 4, letterSpacing: 0.6 }} accessibilityRole="header">
              {day.toUpperCase()}
            </Text>
            <View style={{ backgroundColor: c.surface, borderRadius: radius.lg, overflow: "hidden", paddingVertical: 4 }}>
              {shown.filter((t) => t.day === day).map((t) => (
                <TxnRow key={t.id} txn={t} hide={hide} />
              ))}
            </View>
          </View>
        ))
      )}
    </AppPage>
  );
}

function ListSkeleton() {
  const c = useColors();
  const bar = (w: number | `${number}%`, h: number, r = 8) => <View style={{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }} />;
  return (
    <View style={{ gap: 14, backgroundColor: c.surface, borderRadius: radius.lg, padding: 16 }} accessibilityLabel="Loading your activity">
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {bar(40, 40, 20)}
          <View style={{ flex: 1, gap: 6 }}>
            {bar("60%", 12)}
            {bar("35%", 10)}
          </View>
          {bar(64, 12)}
        </View>
      ))}
    </View>
  );
}

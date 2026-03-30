import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type TailoredResumeData = {
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }>;
  projects?: Array<{
    name: string;
    tech?: string;
    dates?: string;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    dates: string;
    gpa?: string;
  }>;
  skills: string[];
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 36,
  },

  // ── Header ──────────────────────────────────────────
  header: { alignItems: "center", marginBottom: 10 },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 0.5, marginBottom: 4 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 },
  contactItem: { fontSize: 9, color: "#444" },
  contactSep: { fontSize: 9, color: "#bbb" },
  headerDivider: { borderBottomWidth: 1.5, borderBottomColor: "#111", width: "100%", marginTop: 8 },

  // ── Sections ─────────────────────────────────────────
  section: { marginTop: 9 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    paddingBottom: 2,
    marginBottom: 5,
  },

  // ── Entries ──────────────────────────────────────────
  entry: { marginBottom: 7 },
  entryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryOrg: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryDates: { fontSize: 9, color: "#555" },
  entryRole: { fontSize: 9.5, fontFamily: "Helvetica-Oblique", color: "#333", marginBottom: 2 },
  entryTech: { fontSize: 9, color: "#555", marginBottom: 2 },

  // ── Bullets ──────────────────────────────────────────
  bullet: { flexDirection: "row", paddingLeft: 8, marginBottom: 2 },
  bulletDot: { fontSize: 9.5, color: "#333", marginRight: 5 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45, color: "#111" },

  // ── Skills ───────────────────────────────────────────
  skillsText: { fontSize: 9.5, color: "#111", lineHeight: 1.6 },
});

function Bullets({ bullets }: { bullets: string[] }) {
  return (
    <>
      {bullets.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </>
  );
}

export function ResumeDocument({ data }: { data: TailoredResumeData }) {
  const contactParts = [data.email, data.phone, data.linkedin, data.github].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.name}>{data.name}</Text>
          <View style={s.contactRow}>
            {contactParts.map((part, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center" }}>
                {i > 0 && <Text style={s.contactSep}>  |  </Text>}
                <Text style={s.contactItem}>{part}</Text>
              </View>
            ))}
          </View>
          <View style={s.headerDivider} />
        </View>

        {/* ── Education (top for students) ── */}
        {data.education.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryTopRow}>
                  <Text style={s.entryOrg}>{edu.school}</Text>
                  <Text style={s.entryDates}>{edu.dates}</Text>
                </View>
                <Text style={s.entryRole}>
                  {edu.degree}{edu.gpa ? `  —  GPA: ${edu.gpa}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Experience ── */}
        {data.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryTopRow}>
                  <Text style={s.entryOrg}>{exp.company}</Text>
                  <Text style={s.entryDates}>{exp.dates}</Text>
                </View>
                <Text style={s.entryRole}>{exp.role}</Text>
                <Bullets bullets={exp.bullets} />
              </View>
            ))}
          </View>
        )}

        {/* ── Projects ── */}
        {data.projects && data.projects.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryTopRow}>
                  <Text style={s.entryOrg}>{proj.name}</Text>
                  {proj.dates ? <Text style={s.entryDates}>{proj.dates}</Text> : null}
                </View>
                {proj.tech ? <Text style={s.entryTech}>{proj.tech}</Text> : null}
                <Bullets bullets={proj.bullets} />
              </View>
            ))}
          </View>
        )}

        {/* ── Skills ── */}
        {data.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.skillsText}>{data.skills.join("   ·   ")}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}

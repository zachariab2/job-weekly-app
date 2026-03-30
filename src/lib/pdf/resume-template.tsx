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
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#111", paddingHorizontal: 44, paddingVertical: 40 },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  contact: { fontSize: 9, color: "#444", flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  contactItem: { color: "#444" },
  divider: { borderBottomWidth: 0.75, borderBottomColor: "#ccc", marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: "#555" },
  sectionLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: "#ddd", marginLeft: 6 },
  section: { marginBottom: 10 },
  entry: { marginBottom: 8 },
  entryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entrySubtitle: { fontSize: 9.5, color: "#333", marginBottom: 1 },
  entryDates: { fontSize: 9, color: "#777" },
  bullet: { flexDirection: "row", marginBottom: 2.5, paddingLeft: 2 },
  bulletDot: { fontSize: 9.5, color: "#555", marginRight: 5, marginTop: 0.5 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45, color: "#222" },
  skillsText: { fontSize: 9.5, color: "#222", lineHeight: 1.6 },
});

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

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
  const contactParts = [data.email, data.phone, data.linkedin, data.github].filter(Boolean);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>

        {/* Header */}
        <Text style={s.name}>{data.name}</Text>
        <View style={s.contact}>
          {contactParts.map((part, i) => (
            <Text key={i} style={s.contactItem}>{part}</Text>
          ))}
        </View>
        <View style={s.divider} />

        {/* Experience */}
        {data.experience.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Experience" />
            {data.experience.map((exp, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>{exp.company}</Text>
                  <Text style={s.entryDates}>{exp.dates}</Text>
                </View>
                <Text style={s.entrySubtitle}>{exp.role}</Text>
                <Bullets bullets={exp.bullets} />
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Projects" />
            {data.projects.map((proj, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>
                    {proj.name}{proj.tech ? `  |  ${proj.tech}` : ""}
                  </Text>
                  {proj.dates && <Text style={s.entryDates}>{proj.dates}</Text>}
                </View>
                <Bullets bullets={proj.bullets} />
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Education" />
            {data.education.map((edu, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.entryTitle}>{edu.school}</Text>
                  <Text style={s.entryDates}>{edu.dates}</Text>
                </View>
                <Text style={s.entrySubtitle}>{edu.degree}{edu.gpa ? `  ·  GPA ${edu.gpa}` : ""}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={s.section}>
            <SectionTitle title="Skills" />
            <Text style={s.skillsText}>{data.skills.join("  ·  ")}</Text>
          </View>
        )}

      </Page>
    </Document>
  );
}

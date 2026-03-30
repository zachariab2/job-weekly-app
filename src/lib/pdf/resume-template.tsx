import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type TailoredResumeData = {
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  experience: Array<{
    company: string;
    role: string;
    dates: string;
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
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a", paddingHorizontal: 48, paddingVertical: 44 },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  contact: { fontSize: 9, color: "#555", flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  contactItem: { color: "#555" },
  divider: { borderBottomWidth: 1, borderBottomColor: "#ddd", marginBottom: 10 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1.2, color: "#888", marginBottom: 6 },
  summary: { fontSize: 10, lineHeight: 1.5, color: "#333", marginBottom: 14 },
  entryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  entryCompany: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  entryRole: { fontSize: 10, color: "#444", marginBottom: 1 },
  entryDates: { fontSize: 9, color: "#888" },
  bullet: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  bulletDot: { fontSize: 10, color: "#888", marginRight: 6 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.45, color: "#333" },
  entry: { marginBottom: 10 },
  section: { marginBottom: 14 },
  skillsText: { fontSize: 9.5, color: "#333", lineHeight: 1.5 },
});

export function ResumeDocument({ data }: { data: TailoredResumeData }) {
  const contactParts = [
    data.email,
    data.phone,
    data.linkedin,
    data.github,
  ].filter(Boolean);

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

        {/* Summary */}
        {data.summary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Experience</Text>
            {data.experience.map((exp, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.entryCompany}>{exp.company}</Text>
                  <Text style={s.entryDates}>{exp.dates}</Text>
                </View>
                <Text style={s.entryRole}>{exp.role}</Text>
                {exp.bullets.map((b, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={s.entry}>
                <View style={s.entryRow}>
                  <Text style={s.entryCompany}>{edu.school}</Text>
                  <Text style={s.entryDates}>{edu.dates}</Text>
                </View>
                <Text style={s.entryRole}>{edu.degree}{edu.gpa ? ` · GPA ${edu.gpa}` : ""}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.skillsText}>{data.skills.join(" · ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

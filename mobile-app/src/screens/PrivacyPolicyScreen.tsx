import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>PRIVACY POLICY</Text>
        <Text style={styles.company}>PopupReach Inc.</Text>
        <Text style={styles.effectiveDate}>Effective Date: October 22, 2025</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.text}>
          PopupReach Inc. ("Company," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform that delivers promotional offers and marketing communications to customers through mobile popups, as well as our AI-powered shopping assistant and AI-powered business solutions (collectively, the "Services").
        </Text>
        <Text style={styles.text}>
          Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Services.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>

        <Text style={styles.subsectionTitle}>2.1 Information You Provide Directly</Text>
        <Text style={styles.bulletPoint}>• Account registration information (name, email, phone number, business details)</Text>
        <Text style={styles.bulletPoint}>• Payment and billing information</Text>
        <Text style={styles.bulletPoint}>• Business profile data and promotional content</Text>
        <Text style={styles.bulletPoint}>• Customer communications and support requests</Text>
        <Text style={styles.bulletPoint}>• Information you voluntarily provide through forms, surveys, or feedback</Text>

        <Text style={styles.subsectionTitle}>2.2 Information Collected Automatically</Text>
        <Text style={styles.bulletPoint}>• Device information (device type, operating system, device identifiers)</Text>
        <Text style={styles.bulletPoint}>• Mobile popup interaction data (views, clicks, engagement metrics)</Text>
        <Text style={styles.bulletPoint}>• IP address and location data</Text>
        <Text style={styles.bulletPoint}>• Cookies and similar tracking technologies</Text>
        <Text style={styles.bulletPoint}>• Browser type and pages visited</Text>
        <Text style={styles.bulletPoint}>• Usage patterns and analytics</Text>

        <Text style={styles.subsectionTitle}>2.3 Customer Shopping Data</Text>
        <Text style={styles.text}>Our AI Shopping Assistant analyzes:</Text>
        <Text style={styles.bulletPoint}>• Purchase history and transaction records</Text>
        <Text style={styles.bulletPoint}>• Product browsing and search behavior</Text>
        <Text style={styles.bulletPoint}>• Product preferences and categories of interest</Text>
        <Text style={styles.bulletPoint}>• Price comparison and deal-seeking patterns</Text>
        <Text style={styles.bulletPoint}>• Demographic and behavioral information</Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.bulletPoint}>• Deliver and improve our Services</Text>
        <Text style={styles.bulletPoint}>• Personalize user experience and targeted recommendations</Text>
        <Text style={styles.bulletPoint}>• Generate insights through our AI Shopping Assistant to help customers find better deals</Text>
        <Text style={styles.bulletPoint}>• Provide AI-powered recommendations to businesses for deal optimization</Text>
        <Text style={styles.bulletPoint}>• Automate deal and offer creation for partner businesses</Text>
        <Text style={styles.bulletPoint}>• Process transactions and send related information</Text>
        <Text style={styles.bulletPoint}>• Send promotional materials, updates, and customer service communications</Text>
        <Text style={styles.bulletPoint}>• Conduct analytics and monitor platform performance</Text>
        <Text style={styles.bulletPoint}>• Detect, prevent, and address fraud and security issues</Text>
        <Text style={styles.bulletPoint}>• Comply with legal obligations and protect our rights</Text>

        <Text style={styles.sectionTitle}>4. Information Sharing and Disclosure</Text>

        <Text style={styles.subsectionTitle}>4.1 Service Providers</Text>
        <Text style={styles.text}>
          We may share information with third-party service providers who perform services on our behalf, including payment processors, cloud storage providers, analytics providers, and AI/ML technology partners.
        </Text>

        <Text style={styles.subsectionTitle}>4.2 Business Partners</Text>
        <Text style={styles.text}>
          Local businesses using our platform receive aggregated and anonymized data about customer engagement with their offers. We do not share individual customer personal information with businesses without explicit consent.
        </Text>

        <Text style={styles.subsectionTitle}>4.3 Legal Compliance</Text>
        <Text style={styles.text}>
          We may disclose information when required by law, court order, government request, or to protect our legal rights, privacy, safety, or property.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate technical and organizational measures designed to protect your information against unauthorized access, alteration, disclosure, or destruction. These include:
        </Text>
        <Text style={styles.bulletPoint}>• Encryption of data in transit and at rest</Text>
        <Text style={styles.bulletPoint}>• Secure socket layer (SSL) technology</Text>
        <Text style={styles.bulletPoint}>• Access controls and authentication protocols</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and vulnerability assessments</Text>
        <Text style={styles.bulletPoint}>• Employee training on data protection</Text>
        <Text style={styles.disclaimer}>
          Note: No method of transmission over the internet or electronic storage is completely secure. While we strive to protect your information, we cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Privacy Rights</Text>

        <Text style={styles.subsectionTitle}>6.1 Access and Portability</Text>
        <Text style={styles.text}>
          You have the right to access, review, and receive a copy of your personal information in a portable format.
        </Text>

        <Text style={styles.subsectionTitle}>6.2 Correction and Deletion</Text>
        <Text style={styles.text}>
          You may request correction of inaccurate information or deletion of information about you (subject to legal retention requirements).
        </Text>

        <Text style={styles.subsectionTitle}>6.3 Opt-Out Rights</Text>
        <Text style={styles.text}>
          You may opt out of promotional communications at any time by following the unsubscribe instructions in our emails or adjusting your account settings.
        </Text>

        <Text style={styles.sectionTitle}>7. Cookies and Tracking Technologies</Text>
        <Text style={styles.text}>We use cookies, pixels, web beacons, and similar technologies to:</Text>
        <Text style={styles.bulletPoint}>• Recognize you and remember your preferences</Text>
        <Text style={styles.bulletPoint}>• Understand how you use our Services</Text>
        <Text style={styles.bulletPoint}>• Measure the effectiveness of marketing campaigns</Text>
        <Text style={styles.bulletPoint}>• Provide personalized recommendations</Text>
        <Text style={styles.text}>
          You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our Services.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.text}>
          Our Services are not intended for individuals under the age of 13 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information promptly.
        </Text>

        <Text style={styles.sectionTitle}>9. Privacy Rights Under Canadian Law</Text>

        <Text style={styles.subsectionTitle}>9.1 PIPEDA Compliance</Text>
        <Text style={styles.text}>
          PopupReach Inc. operates in compliance with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation in Manitoba. As a user in Canada, you have the right to:
        </Text>
        <Text style={styles.bulletPoint}>• Access your personal information held by us</Text>
        <Text style={styles.bulletPoint}>• Request correction of inaccurate personal information</Text>
        <Text style={styles.bulletPoint}>• Understand how your information is being used and disclosed</Text>
        <Text style={styles.bulletPoint}>• Opt out of non-essential uses of your personal information</Text>
        <Text style={styles.bulletPoint}>• Lodge complaints with the Privacy Commissioner of Canada</Text>

        <Text style={styles.sectionTitle}>10. AI and Automated Decision-Making</Text>
        <Text style={styles.text}>Our Services use AI and machine learning algorithms to:</Text>
        <Text style={styles.bulletPoint}>• Analyze customer shopping behavior and recommend deals</Text>
        <Text style={styles.bulletPoint}>• Help businesses optimize pricing and offers</Text>
        <Text style={styles.bulletPoint}>• Automate deal creation and distribution</Text>
        <Text style={styles.text}>
          These automated processes do not make legally binding decisions about you. You have the right to request human review or explanation of AI-generated recommendations.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.text}>If you have questions about this Privacy Policy or our privacy practices, please contact us at:</Text>
        <Text style={styles.text}>PopupReach Inc.</Text>
        <Text style={styles.text}>Email: info@popupreach.com</Text>
        <Text style={styles.text}>Phone: +1 (431) 445-0998</Text>
        <Text style={styles.text}>Address: 100 Innovation Dr #44, Winnipeg, MB R3T 6A8, Canada</Text>

        <Text style={styles.sectionTitle}>12. Changes to This Privacy Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. The "Effective Date" at the top of this document indicates when it was last revised. Continued use of our Services after changes constitutes your acceptance of the updated Privacy Policy.
        </Text>

        <Text style={styles.lastUpdated}>Last Updated: October 22, 2025</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  company: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginTop: 15,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 5,
    marginLeft: 10,
  },
  disclaimer: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
    fontStyle: 'italic',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 30,
    textAlign: 'center',
  },
});

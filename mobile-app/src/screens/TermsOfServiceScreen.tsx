import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>TERMS AND CONDITIONS</Text>
        <Text style={styles.company}>PopupReach Inc.</Text>
        <Text style={styles.effectiveDate}>Effective Date: October 22, 2025</Text>

        <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
        <Text style={styles.text}>
          By accessing and using PopupReach Inc.'s platform ("Service") that delivers mobile pop-up promotions, offers, and our AI-powered shopping assistant and business analytics tools (collectively, "Services"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to be bound by these Terms, you are not authorized to access, download, or use our Services.
        </Text>

        <Text style={styles.sectionTitle}>2. Use License</Text>
        <Text style={styles.subsectionTitle}>2.1 Grant of License</Text>
        <Text style={styles.text}>
          PopupReach Inc. grants you a limited, non-exclusive, non-transferable, revocable license to access and use our Services, provided you comply with these Terms and all applicable laws and regulations.
        </Text>

        <Text style={styles.subsectionTitle}>2.2 Restrictions</Text>
        <Text style={styles.text}>You agree not to:</Text>
        <Text style={styles.bulletPoint}>• Reproduce, duplicate, copy, or resell any part of the Services</Text>
        <Text style={styles.bulletPoint}>• Modify or create derivatives of the Services</Text>
        <Text style={styles.bulletPoint}>• Attempt to gain unauthorized access to the Services or related systems</Text>
        <Text style={styles.bulletPoint}>• Use the Services for unlawful or fraudulent purposes</Text>
        <Text style={styles.bulletPoint}>• Reverse engineer, decompile, or attempt to discover source code</Text>
        <Text style={styles.bulletPoint}>• Engage in any form of automated data harvesting or scraping</Text>
        <Text style={styles.bulletPoint}>• Interfere with or disrupt the Services or servers</Text>
        <Text style={styles.bulletPoint}>• Transmit viruses, malware, or any harmful code</Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.subsectionTitle}>3.1 Account Creation</Text>
        <Text style={styles.text}>
          To use certain features of the Services, you may be required to create an account. You agree to provide accurate, current, and complete information and to update this information as necessary. You are responsible for maintaining the confidentiality of your account credentials and password.
        </Text>

        <Text style={styles.subsectionTitle}>3.2 Account Responsibility</Text>
        <Text style={styles.text}>
          You are solely responsible for all activities conducted under your account. You agree to notify us immediately of any unauthorized use of your account or any other security breach.
        </Text>

        <Text style={styles.subsectionTitle}>3.3 Account Eligibility</Text>
        <Text style={styles.text}>
          You represent and warrant that you are at least 18 years of age and have the legal authority to enter into this agreement. If you are acting on behalf of a business, you represent that you have the authority to bind that business to these Terms.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use Policy</Text>
        <Text style={styles.text}>
          You agree to use the Services only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment. Prohibited behavior includes:
        </Text>
        <Text style={styles.bulletPoint}>• Harassing, threatening, intimidating, or abusive conduct</Text>
        <Text style={styles.bulletPoint}>• Transmitting obscene, defamatory, or misleading content</Text>
        <Text style={styles.bulletPoint}>• Creating misleading or false offers and promotions</Text>
        <Text style={styles.bulletPoint}>• Violating intellectual property rights</Text>
        <Text style={styles.bulletPoint}>• Engaging in fraud, deception, or misrepresentation</Text>
        <Text style={styles.bulletPoint}>• Attempting to gain unauthorized access to systems</Text>
        <Text style={styles.bulletPoint}>• Violating any applicable laws or regulations</Text>
        <Text style={styles.bulletPoint}>• Engaging in any activity that disrupts the Services</Text>

        <Text style={styles.sectionTitle}>5. Service Features</Text>
        <Text style={styles.subsectionTitle}>5.1 Mobile Pop-Up Delivery</Text>
        <Text style={styles.text}>
          PopupReach delivers promotional offers and deals to customers through mobile pop-ups. By using our Services, you consent to receive these communications. You may manage notification preferences through your account settings.
        </Text>

        <Text style={styles.subsectionTitle}>5.2 AI Shopping Assistant</Text>
        <Text style={styles.text}>Our AI Shopping Assistant analyzes customer purchase history and behavior to recommend the most cost-effective shopping options. The Assistant:</Text>
        <Text style={styles.bulletPoint}>• Provides deal recommendations and price comparisons</Text>
        <Text style={styles.bulletPoint}>• Identifies cost-saving opportunities</Text>
        <Text style={styles.bulletPoint}>• Works across multiple retailers and platforms</Text>

        <Text style={styles.subsectionTitle}>5.3 AI Business Assistant</Text>
        <Text style={styles.text}>For business users, our AI Business Assistant provides:</Text>
        <Text style={styles.bulletPoint}>• Deal and offer recommendations based on market analysis</Text>
        <Text style={styles.bulletPoint}>• Automated deal creation and optimization</Text>
        <Text style={styles.bulletPoint}>• Performance analytics and insights</Text>
        <Text style={styles.bulletPoint}>• Competitive market intelligence</Text>

        <Text style={styles.sectionTitle}>6. Intellectual Property Rights</Text>
        <Text style={styles.subsectionTitle}>6.1 Service Ownership</Text>
        <Text style={styles.text}>
          All content, features, and functionality of the Services, including but not limited to software, technology, algorithms, trademarks, logos, and designs, are owned by PopupReach Inc., its licensors, or other providers of such material and are protected by copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.subsectionTitle}>6.2 User Content</Text>
        <Text style={styles.text}>By submitting content to the Services (including offers, deals, descriptions, images, and other materials), you:</Text>
        <Text style={styles.bulletPoint}>• Retain ownership of your content</Text>
        <Text style={styles.bulletPoint}>• Grant PopupReach Inc. a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content</Text>
        <Text style={styles.bulletPoint}>• Warrant that your content does not infringe third-party rights</Text>
        <Text style={styles.bulletPoint}>• Accept responsibility for the accuracy and legality of your content</Text>

        <Text style={styles.sectionTitle}>7. Disclaimer of Warranties</Text>
        <Text style={styles.disclaimer}>
          DISCLAIMER: THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. POPUPREACH INC. DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </Text>

        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
        <Text style={styles.disclaimer}>
          TO THE FULLEST EXTENT PERMITTED BY CANADIAN LAW, POPUPREACH INC. SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO POPUPREACH INC. IN THE PAST 12 MONTHS.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact Information</Text>
        <Text style={styles.text}>For questions about these Terms and Conditions, please contact:</Text>
        <Text style={styles.text}>PopupReach Inc.</Text>
        <Text style={styles.text}>Email: info@popupreach.com</Text>
        <Text style={styles.text}>Phone: +1 (431) 445-0998</Text>
        <Text style={styles.text}>Address: 100 Innovation Dr #44, Winnipeg, MB R3T 6A8, Canada</Text>

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

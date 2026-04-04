import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">{t('contact.title')}</h1>
          <p className="text-xl text-muted-foreground">{t('contact.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="bg-card border-2 hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-foreground">Get in Touch</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Our team is available to answer your questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <a href="mailto:support@fellaw.de" className="text-primary hover:underline">
                      support@fellaw.de
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Phone</p>
                    <a href="tel:+4930123456789" className="text-primary hover:underline">
                      +49 30 123 456 789
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Address</p>
                    <p className="text-muted-foreground">
                      Friedrichstraße 123<br />
                      10117 Berlin, Germany
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Business Hours</p>
                    <p className="text-muted-foreground">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 2:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="bg-card border-2 hover:shadow-xl transition-all">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Quick Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">How quickly will I get a response?</p>
                  <p className="text-sm text-muted-foreground">We typically respond within 24 hours on business days.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Is my information confidential?</p>
                  <p className="text-sm text-muted-foreground">Yes, all communications are strictly confidential and protected by legal privilege.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Do you offer emergency support?</p>
                  <p className="text-sm text-muted-foreground">Yes, use our Crisis Now feature on the homepage for urgent legal situations.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="bg-card border-2 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="text-foreground">Send us a Message</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill out the form below and we'll get back to you soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                    Your Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-1">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                  />
                </div>

                {submitted && (
                  <div className="p-3 bg-success/10 border-2 border-success rounded">
                    <p className="text-sm text-success">Message sent successfully! We'll get back to you soon.</p>
                  </div>
                )}

                <Button type="submit" className="w-full h-12">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Support Options */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-card border-2 border-primary hover:shadow-xl transition-all p-6 flex flex-col h-full">
            <div className="text-center flex-1 flex flex-col">
              <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2 h-[28px]">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-4 h-[48px] flex items-center justify-center">
                Chat with our AI assistant or connect with a support representative
              </p>
              <Button variant="outline" className="w-full mt-auto">
                Start Chat
              </Button>
            </div>
          </Card>

          <Card className="bg-card border-2 border-success hover:shadow-xl transition-all p-6 flex flex-col h-full">
            <div className="text-center flex-1 flex flex-col">
              <HelpCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2 h-[28px]">Help Center</h3>
              <p className="text-sm text-muted-foreground mb-4 h-[48px] flex items-center justify-center">
                Browse our comprehensive knowledge base and FAQs
              </p>
              <Button variant="outline" className="w-full mt-auto">
                Visit Help Center
              </Button>
            </div>
          </Card>

          <Card className="bg-card border-2 border-accent hover:shadow-xl transition-all p-6 flex flex-col h-full">
            <div className="text-center flex-1 flex flex-col">
              <Phone className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2 h-[28px]">Schedule Call</h3>
              <p className="text-sm text-muted-foreground mb-4 h-[48px] flex items-center justify-center">
                Book a time to speak with our support team
              </p>
              <Button variant="outline" className="w-full mt-auto">
                Book Appointment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contact;

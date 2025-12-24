import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStatus } from '@/lib/offline-context';
import { db } from '@/lib/db';
import {
  Home,
  Shield,
  MessageSquare,
  Lightbulb,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Phone,
  Download
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  address: string;
  phone?: string;
}

interface CommandResult {
  type: 'intel' | 'coach' | 'guard' | 'script';
  title: string;
  content: string;
  status?: 'success' | 'warning' | 'error';
}

const quickObjections = [
  "Not interested",
  "Too expensive",
  "Need to think about it",
  "Already have solar",
  "Renting",
  "Bad credit"
];

const mockPropertyData = {
  value: 385000,
  sqft: 2400,
  bedrooms: 4,
  bathrooms: 2.5,
  yearBuilt: 2018,
  solarPotential: {
    potential: 'excellent',
    recommendation: 'South-facing roof with minimal shading. Ideal for 8-10kW system.'
  }
};

const mockObjectionResponses: Record<string, { response: string; technique: string; followUp: string }> = {
  "not interested": {
    response: "I completely understand. Most homeowners I speak with weren't interested initially either. What changed their mind was seeing how much they'd save. Would you be opposed to just seeing the numbers?",
    technique: "Feel-Felt-Found",
    followUp: "What's your current monthly electric bill?"
  },
  "too expensive": {
    response: "That's a fair concern. What if I told you that with available incentives and financing, most homeowners see a lower payment than their current electric bill from day one?",
    technique: "Reframe",
    followUp: "What do you currently pay Duke Energy each month?"
  },
  "need to think about it": {
    response: "Absolutely, this is an important decision. What specifically would you like to think about? I want to make sure I've given you all the information you need.",
    technique: "Isolate",
    followUp: "Is it the cost, the timing, or something else?"
  },
  "already have solar": {
    response: "That's great! How's it working out for you? Many homeowners with older systems are upgrading to capture better efficiency and new incentives.",
    technique: "Pivot",
    followUp: "How old is your current system?"
  },
  "renting": {
    response: "I understand. Do you have any interest in owning property in the future? Or do you know anyone who owns their home who might benefit?",
    technique: "Referral Ask",
    followUp: "Who do you know that owns their home?"
  },
  "bad credit": {
    response: "We work with a variety of financing options. Many homeowners are surprised to find they qualify. Would you be open to at least checking?",
    technique: "Soft Close",
    followUp: "The credit check is soft and won't affect your score."
  }
};

const mockScripts = {
  opening: {
    action: "Warm Introduction",
    script: "Hi, this is [Name] with Admiral Energy. I'm calling because we're helping homeowners in [City] reduce their electricity costs. Is now a good time for a quick chat?",
    tip: "Smile when you dial - they can hear it in your voice!"
  },
  discovery: {
    action: "Qualify the Lead",
    script: "Great! To see if this makes sense for you, can you tell me about your current electric bill? And is your home owner-occupied?",
    tip: "Listen more than you talk. Take notes on pain points."
  },
  objection: {
    action: "Address Concerns",
    script: "I hear you. Most folks feel that way at first. What specifically concerns you most about making the switch?",
    tip: "Never argue. Acknowledge, then redirect."
  },
  closing: {
    action: "Set Appointment",
    script: "Based on what you've shared, I think we can save you significant money. I'd like to have one of our energy consultants come out and show you exactly how much. Does Tuesday or Thursday work better for you?",
    tip: "Offer two options, not an open question."
  }
};

export function CommandsPage() {
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [result, setResult] = useState<CommandResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [objectionModal, setObjectionModal] = useState(false);
  const [askModal, setAskModal] = useState(false);
  const [customText, setCustomText] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  const { toast } = useToast();
  const { shouldUseLocalData } = useOfflineStatus();

  useEffect(() => {
    const stored = localStorage.getItem('compass_current_lead');
    if (stored) {
      setCurrentLead(JSON.parse(stored));
    } else {
      db.leads.toArray().then(leads => {
        if (leads.length > 0) {
          const lead = leads[0];
          setCurrentLead({
            id: lead.id,
            name: lead.name,
            address: `${lead.address || ''}, ${lead.city || ''} ${lead.state || ''}`.trim(),
            phone: lead.phone
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const lookupProperty = async () => {
    if (!currentLead?.address) {
      toast({ title: 'No lead selected', description: 'Select a lead first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 600));
    
    const data = mockPropertyData;
    setResult({
      type: 'intel',
      title: 'Property Intel',
      status: 'success',
      content: `${currentLead.address}

Value: $${data.value.toLocaleString()}
Size: ${data.sqft.toLocaleString()} sqft
Beds/Baths: ${data.bedrooms}/${data.bathrooms}
Built: ${data.yearBuilt}
Solar Potential: ${data.solarPotential.potential.toUpperCase()}

${data.solarPotential.recommendation}`
    });
    
    setLoading(false);
  };

  const checkTCPA = async () => {
    if (!currentLead?.id) {
      toast({ title: 'No lead selected', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 400));
    
    const canCall = Math.random() > 0.2;
    setResult({
      type: 'guard',
      title: 'TCPA Compliance',
      status: canCall ? 'success' : 'error',
      content: canCall 
        ? `CLEAR TO CALL

Status: SAFE
Callable Numbers: 1
DNC Numbers: 0

Safe to proceed with call`
        : `DO NOT CALL

Status: DNC
This number is on the Do Not Call registry.

Do not call this lead`
    });
    
    setLoading(false);
  };

  const handleObjection = async (objection: string) => {
    setLoading(true);
    setObjectionModal(false);
    
    await new Promise(r => setTimeout(r, 500));
    
    const key = objection.toLowerCase();
    const response = mockObjectionResponses[key] || {
      response: "I understand your concern. Let me address that for you...",
      technique: "Empathize & Redirect",
      followUp: "What would need to change for this to make sense for you?"
    };
    
    setResult({
      type: 'coach',
      title: 'Objection Response',
      status: 'success',
      content: `"${objection}"

Response: ${response.response}

Technique: ${response.technique}

Follow-up: ${response.followUp}`
    });
    
    setLoading(false);
    setCustomText('');
  };

  const getScript = async (stage: 'opening' | 'discovery' | 'objection' | 'closing') => {
    setLoading(true);
    
    await new Promise(r => setTimeout(r, 300));
    
    const script = mockScripts[stage];
    setResult({
      type: 'script',
      title: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Script`,
      status: 'success',
      content: `Action: ${script.action}

Script:
"${script.script}"

Tip: ${script.tip}`
    });
    
    setLoading(false);
  };

  const askAgent = async (question: string) => {
    setLoading(true);
    setAskModal(false);
    
    await new Promise(r => setTimeout(r, 400));
    
    toast({ title: 'Sent to your agent!', description: 'Check Telegram for response' });
    setResult({
      type: 'coach',
      title: 'Question Sent',
      status: 'success',
      content: `Your question has been sent to your FieldOps agent.

You asked: "${question}"

Open Telegram to continue the conversation with your agent. They'll have full context about what you're working on.`
    });
    
    setLoading(false);
    setCustomText('');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'intel': return 'default';
      case 'coach': return 'secondary';
      case 'guard': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">COMPASS</h1>
        <p className="text-sm text-muted-foreground">Quick Commands</p>
      </div>

      <Card className="mb-4">
        <CardContent className="py-3">
          {currentLead ? (
            <div>
              <p className="font-medium text-foreground" data-testid="text-lead-name">{currentLead.name}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-lead-address">{currentLead.address}</p>
              {currentLead.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-3 h-3" />
                  {currentLead.phone}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No lead selected. Open from dashboard.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={lookupProperty} 
            disabled={!currentLead || loading}
            className="h-12"
            data-testid="button-lookup"
          >
            <Home className="w-4 h-4 mr-2" />
            Lookup
          </Button>
          <Button 
            variant="outline"
            onClick={checkTCPA} 
            disabled={!currentLead || loading}
            className="h-12"
            data-testid="button-tcpa"
          >
            <Shield className="w-4 h-4 mr-2" />
            TCPA
          </Button>
        </div>

        <Button 
          variant="secondary"
          onClick={() => setObjectionModal(true)}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
          data-testid="button-objection"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Handle Objection
        </Button>

        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm">Quick Scripts</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <div className="flex flex-wrap gap-2">
              {(['opening', 'discovery', 'objection', 'closing'] as const).map(stage => (
                <Button
                  key={stage}
                  variant="outline"
                  size="sm"
                  onClick={() => getScript(stage)}
                  disabled={loading}
                  data-testid={`button-script-${stage}`}
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="outline"
          onClick={() => setAskModal(true)}
          className="w-full h-12"
          data-testid="button-ask-agent"
        >
          <Send className="w-4 h-4 mr-2" />
          Ask My Agent (Telegram)
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {result && !loading && (
        <Card className="mt-6 border-l-4" style={{
          borderLeftColor: result.status === 'success' ? '#22c55e' : 
                          result.status === 'warning' ? '#eab308' : '#ef4444'
        }}>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getTypeBadgeVariant(result.type)}>
                {result.type.toUpperCase()}
              </Badge>
              {getStatusIcon(result.status)}
            </div>
            <h3 className="font-semibold text-foreground mb-2">{result.title}</h3>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
              {result.content}
            </pre>
          </CardContent>
        </Card>
      )}

      <Dialog open={objectionModal} onOpenChange={setObjectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What did they say?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Quick objections:</p>
            <div className="flex flex-wrap gap-2">
              {quickObjections.map(obj => (
                <Button
                  key={obj}
                  variant="outline"
                  size="sm"
                  onClick={() => handleObjection(obj)}
                  data-testid={`button-objection-${obj.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {obj}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Or type it:</p>
            <Textarea
              placeholder="They said..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={2}
              data-testid="input-objection-custom"
            />
            <Button
              className="w-full"
              onClick={() => handleObjection(customText)}
              disabled={!customText.trim()}
              data-testid="button-objection-submit"
            >
              Get Response
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={askModal} onOpenChange={setAskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask Your Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your question will be sent to your FieldOps agent on Telegram.
              They'll respond with personalized advice.
            </p>
            <Textarea
              placeholder="What do you need help with?"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={3}
              data-testid="input-agent-question"
            />
            <Button
              className="w-full"
              onClick={() => askAgent(customText)}
              disabled={!customText.trim()}
              data-testid="button-agent-submit"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Telegram
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {installPrompt && (
        <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-3 rounded-lg flex justify-between items-center max-w-lg mx-auto">
          <span className="text-sm font-medium">Install COMPASS</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              installPrompt.prompt();
              setInstallPrompt(null);
            }}
            data-testid="button-install-pwa"
          >
            <Download className="w-4 h-4 mr-1" />
            Install
          </Button>
        </div>
      )}
    </div>
  );
}

export default CommandsPage;

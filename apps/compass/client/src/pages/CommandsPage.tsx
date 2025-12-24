import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOfflineStatus } from '@/lib/offline-context';
import { db } from '@/lib/db';
import { apiRequest } from '@/lib/queryClient';
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

const offlineMockData = {
  property: {
    value: 385000,
    sqft: 2400,
    bedrooms: 4,
    bathrooms: 2.5,
    yearBuilt: 2018
  },
  solarPotential: {
    potential: 'excellent',
    recommendation: 'South-facing roof with minimal shading. Ideal for 8-10kW system.'
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
    
    try {
      let data;
      if (shouldUseLocalData) {
        data = offlineMockData;
      } else {
        const response = await apiRequest('POST', '/api/lookup', {
          address: currentLead.address,
          leadId: currentLead.id
        });
        data = await response.json();
      }
      
      setResult({
        type: 'intel',
        title: 'Property Intel',
        status: 'success',
        content: `${currentLead.address}

Value: $${data.property.value.toLocaleString()}
Size: ${data.property.sqft.toLocaleString()} sqft
Beds/Baths: ${data.property.bedrooms}/${data.property.bathrooms}
Built: ${data.property.yearBuilt}
Solar Potential: ${data.solarPotential.potential.toUpperCase()}

${data.solarPotential.recommendation}`
      });
    } catch (error) {
      toast({ title: 'Lookup failed', description: 'Could not fetch property data', variant: 'destructive' });
    }
    
    setLoading(false);
  };

  const checkTCPA = async () => {
    if (!currentLead?.id) {
      toast({ title: 'No lead selected', variant: 'destructive' });
      return;
    }
    setLoading(true);
    
    try {
      let data;
      if (shouldUseLocalData) {
        data = { status: 'safe', canCall: true };
      } else {
        const response = await fetch(`/api/tcpa/${currentLead.id}`);
        data = await response.json();
      }
      
      const canCall = data.canCall;
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
    } catch (error) {
      toast({ title: 'TCPA check failed', variant: 'destructive' });
    }
    
    setLoading(false);
  };

  const handleObjection = async (objection: string) => {
    setLoading(true);
    setObjectionModal(false);
    
    try {
      let data;
      if (shouldUseLocalData) {
        data = {
          response: "I understand your concern. Let me address that for you.",
          technique: "Empathize & Redirect",
          followUp: "What would need to change for this to make sense for you?"
        };
      } else {
        const response = await apiRequest('POST', '/api/objection', { objection });
        data = await response.json();
      }
      
      setResult({
        type: 'coach',
        title: 'Objection Response',
        status: 'success',
        content: `"${objection}"

Response: ${data.response}

Technique: ${data.technique}

Follow-up: ${data.followUp}`
      });
    } catch (error) {
      toast({ title: 'Failed to get response', variant: 'destructive' });
    }
    
    setLoading(false);
    setCustomText('');
  };

  const getScript = async (stage: 'opening' | 'discovery' | 'objection' | 'closing') => {
    setLoading(true);
    
    try {
      let data;
      if (shouldUseLocalData) {
        const offlineScripts: Record<string, any> = {
          opening: { action: "Warm Introduction", script: "Hi, this is [Name] with Admiral Energy...", tip: "Smile when you dial!" },
          discovery: { action: "Qualify the Lead", script: "Can you tell me about your current electric bill?", tip: "Listen more than you talk." },
          objection: { action: "Address Concerns", script: "What specifically concerns you most?", tip: "Never argue. Acknowledge, then redirect." },
          closing: { action: "Set Appointment", script: "Does Tuesday or Thursday work better?", tip: "Offer two options, not an open question." }
        };
        data = offlineScripts[stage];
      } else {
        const response = await apiRequest('POST', '/api/suggest-action', { callState: stage });
        data = await response.json();
      }
      
      setResult({
        type: 'script',
        title: `${stage.charAt(0).toUpperCase() + stage.slice(1)} Script`,
        status: 'success',
        content: `Action: ${data.action}

Script:
"${data.script}"

Tip: ${data.tip}`
      });
    } catch (error) {
      toast({ title: 'Failed to get script', variant: 'destructive' });
    }
    
    setLoading(false);
  };

  const askAgent = async (question: string) => {
    setLoading(true);
    setAskModal(false);
    
    try {
      if (!shouldUseLocalData) {
        await apiRequest('POST', '/api/telegram-push', {
          userId: 'current-user',
          agentId: 'fieldops-agent',
          question,
          leadContext: currentLead,
          source: 'compass-pwa'
        });
      }
      
      toast({ title: 'Sent to your agent!', description: 'Check Telegram for response' });
      setResult({
        type: 'coach',
        title: 'Question Sent',
        status: 'success',
        content: `Your question has been sent to your FieldOps agent.

You asked: "${question}"

Open Telegram to continue the conversation with your agent. They'll have full context about what you're working on.`
      });
    } catch (error) {
      toast({ title: 'Failed to send question', variant: 'destructive' });
    }
    
    setLoading(false);
    setCustomText('');
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" data-testid="icon-status-success" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" data-testid="icon-status-warning" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" data-testid="icon-status-error" />;
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
    <div className="min-h-screen bg-background p-4 max-w-lg mx-auto" data-testid="page-commands">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">COMPASS</h1>
        <p className="text-sm text-muted-foreground">Quick Commands</p>
      </div>

      <Card className="mb-4" data-testid="card-current-lead">
        <CardContent className="py-3">
          {currentLead ? (
            <div>
              <p className="font-medium text-foreground" data-testid="text-lead-name">{currentLead.name}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-lead-address">{currentLead.address}</p>
              {currentLead.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1" data-testid="text-lead-phone">
                  <Phone className="w-3 h-3" />
                  {currentLead.phone}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground" data-testid="text-no-lead">No lead selected. Open from dashboard.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            size="lg"
            onClick={lookupProperty} 
            disabled={!currentLead || loading}
            data-testid="button-lookup"
          >
            <Home className="w-4 h-4 mr-2" />
            Lookup
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={checkTCPA} 
            disabled={!currentLead || loading}
            data-testid="button-tcpa"
          >
            <Shield className="w-4 h-4 mr-2" />
            TCPA
          </Button>
        </div>

        <Button 
          size="lg"
          variant="default"
          onClick={() => setObjectionModal(true)}
          className="w-full"
          data-testid="button-objection"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Handle Objection
        </Button>

        <Card data-testid="card-quick-scripts">
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
          size="lg"
          variant="outline"
          onClick={() => setAskModal(true)}
          className="w-full"
          data-testid="button-ask-agent"
        >
          <Send className="w-4 h-4 mr-2" />
          Ask My Agent (Telegram)
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8" data-testid="loader-spinner">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {result && !loading && (
        <Card className="mt-6" data-testid="card-result">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getTypeBadgeVariant(result.type)} data-testid={`badge-result-${result.type}`}>
                {result.type.toUpperCase()}
              </Badge>
              {getStatusIcon(result.status)}
            </div>
            <h3 className="font-semibold text-foreground mb-2" data-testid="text-result-title">{result.title}</h3>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans" data-testid="text-result-content">
              {result.content}
            </pre>
          </CardContent>
        </Card>
      )}

      <Dialog open={objectionModal} onOpenChange={setObjectionModal}>
        <DialogContent data-testid="dialog-objection">
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
        <DialogContent data-testid="dialog-ask-agent">
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
        <div 
          className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-3 rounded-md flex justify-between items-center gap-2 max-w-lg mx-auto"
          data-testid="banner-install-pwa"
        >
          <span className="text-sm font-medium" data-testid="text-install-prompt">Install COMPASS</span>
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

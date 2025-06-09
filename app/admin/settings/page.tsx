'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Save, Plus, Trash } from 'lucide-react';
import Link from 'next/link';
import { apiRequest } from '@/lib/utils/api';
import { toast } from 'sonner';

interface Setting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    type: 'string',
    description: '',
  });

  useEffect(() => {
    if (user?.type === 'admin') {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      const response = await apiRequest('/api/admin/settings');
      setSettings(response.settings);
    } catch (error: any) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (setting: Setting) => {
    setSaving(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          key: setting.key,
          value: setting.value,
          type: setting.type,
          description: setting.description,
        }),
      });
      
      toast.success('Setting saved successfully');
      await loadSettings();
    } catch (error: any) {
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const addNewSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast.error('Key and value are required');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(newSetting),
      });
      
      toast.success('Setting added successfully');
      setNewSetting({ key: '', value: '', type: 'string', description: '' });
      await loadSettings();
    } catch (error: any) {
      toast.error('Failed to add setting');
    } finally {
      setSaving(false);
    }
  };

  const updateSettingValue = (key: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.value === 'true'}
            onCheckedChange={(checked) => updateSettingValue(setting.key, checked.toString())}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.value}
            onChange={(e) => updateSettingValue(setting.key, e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        );
      case 'json':
        return (
          <Textarea
            value={setting.value}
            onChange={(e) => updateSettingValue(setting.key, e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            rows={4}
          />
        );
      default:
        return (
          <Input
            value={setting.value}
            onChange={(e) => updateSettingValue(setting.key, e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        );
    }
  };

  if (!user || user.type !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Site Settings</h1>
          <p className="text-gray-400">Configure platform settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="general" className="text-gray-300 data-[state=active]:text-white">
              General Settings
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-gray-300 data-[state=active]:text-white">
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-gray-300 data-[state=active]:text-white">
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Platform Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {settings
                      .filter(setting => ['site_name', 'site_description', 'maintenance_mode', 'registration_enabled'].includes(setting.key))
                      .map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-gray-300">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                              {setting.description && (
                                <p className="text-sm text-gray-500">{setting.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => saveSetting(setting)}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                          {renderSettingInput(setting)}
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Payment & Commission Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {settings
                      .filter(setting => ['default_commission_rate', 'min_withdrawal_amount', 'payment_methods'].includes(setting.key))
                      .map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-gray-300">{setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
                              {setting.description && (
                                <p className="text-sm text-gray-500">{setting.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => saveSetting(setting)}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                          {renderSettingInput(setting)}
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  All Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {settings.map((setting) => (
                      <div key={setting.id} className="bg-gray-700 p-4 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-gray-300 font-mono">{setting.key}</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                                {setting.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                Updated: {new Date(setting.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            {setting.description && (
                              <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => saveSetting(setting)}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                        {renderSettingInput(setting)}
                      </div>
                    ))}

                    {/* Add New Setting */}
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Add New Setting</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">Key</Label>
                            <Input
                              placeholder="setting_key"
                              value={newSetting.key}
                              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                              className="bg-gray-600 border-gray-500 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Type</Label>
                            <Select value={newSetting.type} onValueChange={(value) => setNewSetting({ ...newSetting, type: value })}>
                              <SelectTrigger className="bg-gray-600 border-gray-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="json">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300">Value</Label>
                          <Input
                            placeholder="Setting value"
                            value={newSetting.value}
                            onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">Description (Optional)</Label>
                          <Textarea
                            placeholder="Describe what this setting does"
                            value={newSetting.description}
                            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                            className="bg-gray-600 border-gray-500 text-white"
                            rows={2}
                          />
                        </div>
                        <Button
                          onClick={addNewSetting}
                          disabled={saving || !newSetting.key || !newSetting.value}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Setting
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
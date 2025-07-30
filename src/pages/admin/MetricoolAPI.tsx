import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MetricoolCredentials {
  access_token: string
  user_id: string
}

interface MetricoolBrand {
  id: number
  label: string
  last_synced_at: string
  deleted_at: string | null
  picture: string | null
  // Platform detection fields
  facebookPageId: string | null
  facebook: string | null
  facebookGroupId: string | null
  facebookAds: string | null
  instagram: string | null
  instagramPicture: string | null
  instagramConnectionType: string | null
  tiktok: string | null
  tiktokads: string | null
  tiktokadsDisplayName: string | null
  tiktokadsUserId: string | null
  tiktokPicture: string | null
  linkedinCompany: string | null
  linkedInCompanyName: string | null
  linkedInUserProfileURL: string | null
  linkedInPicture: string | null
  youtube: string | null
  youtubeChannelName: string | null
  youtubeChannelPicture: string | null
  pinterest: string | null
  pinterestBusiness: string | null
  pinterestPicture: string | null
}

interface SyncLog {
  id: number
  started_at: string
  finished_at: string | null
  status: 'success' | 'failed'
  created: number
  updated: number
  marked_deleted: number
  source: 'manual' | 'auto'
  error_message: string | null
}

const PLATFORM_COLORS = {
  Facebook: 'bg-blue-500',
  Instagram: 'bg-pink-500',
  TikTok: 'bg-black',
  LinkedIn: 'bg-blue-700',
  YouTube: 'bg-red-600',
  Pinterest: 'bg-red-500'
}

// Platform detection logic
function detectConnectedPlatforms(brand: MetricoolBrand): string[] {
  const platforms: string[] = []

  if (brand.facebookPageId || brand.facebook || brand.facebookGroupId || brand.facebookAds) {
    platforms.push('Facebook')
  }
  if (brand.instagram || brand.instagramPicture || brand.instagramConnectionType) {
    platforms.push('Instagram')
  }
  if (brand.tiktok || brand.tiktokads || brand.tiktokadsDisplayName || brand.tiktokadsUserId || brand.tiktokPicture) {
    platforms.push('TikTok')
  }
  if (brand.linkedinCompany || brand.linkedInCompanyName || brand.linkedInUserProfileURL || brand.linkedInPicture) {
    platforms.push('LinkedIn')
  }
  if (brand.youtube || brand.youtubeChannelName || brand.youtubeChannelPicture) {
    platforms.push('YouTube')
  }
  if (brand.pinterest || brand.pinterestBusiness || brand.pinterestPicture) {
    platforms.push('Pinterest')
  }

  return platforms
}

export default function MetricoolAPI() {
  const [credentials, setCredentials] = useState<MetricoolCredentials>({
    access_token: '',
    user_id: ''
  })
  const [brands, setBrands] = useState<MetricoolBrand[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const { toast } = useToast()

  // Load existing credentials and data
  useEffect(() => {
    loadCredentials()
    loadBrands()
    loadSyncLogs()
  }, [])

  const loadCredentials = async () => {
    try {
      const { data } = await supabase
        .from('metricool_credentials')
        .select('*')
        .single()

      if (data) {
        setCredentials({
          access_token: data.access_token,
          user_id: data.user_id || ''
        })
      }
    } catch (error) {
      console.error('Error loading credentials:', error)
    }
  }

  const loadBrands = async () => {
    try {
      const { data } = await supabase
        .from('metricool_brands')
        .select('*')
        .order('last_synced_at', { ascending: false })

      if (data) {
        setBrands(data as any)
      }
    } catch (error) {
      console.error('Error loading brands:', error)
    }
  }

  const loadSyncLogs = async () => {
    try {
      const { data } = await supabase
        .from('metricool_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setSyncLogs(data as any)
      }
    } catch (error) {
      console.error('Error loading sync logs:', error)
    }
  }

  const testConnection = async () => {
    if (!credentials.access_token || !credentials.user_id) {
      toast({
        title: "Fout",
        description: "Vul zowel Access Token als User ID in",
        variant: "destructive"
      })
      return
    }

    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const { data, error } = await supabase.functions.invoke('metricool-test-connection', {
        body: {
          accessToken: credentials.access_token,
          userId: credentials.user_id
        }
      })

      if (error) throw error

      if (data.success) {
        setConnectionStatus('success')
        setConnectionMessage(`Verbinding succesvol! ${data.brandCount} brands gevonden.`)
        toast({
          title: "Verbinding succesvol",
          description: `${data.brandCount} brands gevonden`
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      setConnectionStatus('error')
      setConnectionMessage(error.message || 'Verbinding mislukt')
      toast({
        title: "Verbinding mislukt",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const syncBrands = async () => {
    setIsSyncing(true)

    try {
      const { data, error } = await supabase.functions.invoke('metricool-sync-brands', {
        body: { source: 'manual' }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Synchronisatie succesvol",
          description: `${data.created} aangemaakt, ${data.updated} bijgewerkt, ${data.marked_deleted} verwijderd`
        })
        
        // Reload data
        loadBrands()
        loadSyncLogs()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Synchronisatie mislukt",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Metricool API</h1>
        <p className="text-muted-foreground">
          Beheer de verbinding met Metricool en synchroniseer brands
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuratie</CardTitle>
          <CardDescription>
            Stel de Metricool API credentials in voor synchronisatie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="Voer access token in"
                value={credentials.access_token}
                onChange={(e) => setCredentials(prev => ({ ...prev, access_token: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Voer user ID in"
                value={credentials.user_id}
                onChange={(e) => setCredentials(prev => ({ ...prev, user_id: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testConnection} 
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verbinding testen
            </Button>

            <Button 
              onClick={syncBrands} 
              disabled={isSyncing || connectionStatus !== 'success'}
              className="ml-2"
            >
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Handmatige synchronisatie
            </Button>
          </div>

          {connectionStatus !== 'idle' && (
            <Alert className={connectionStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
              {connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>{connectionMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Brands ({brands.filter(b => !b.deleted_at).length})
          </CardTitle>
          <CardDescription>
            Overzicht van alle gesynchroniseerde brands uit Metricool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Laatste sync</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => {
                const connectedPlatforms = detectConnectedPlatforms(brand)
                const isDeleted = !!brand.deleted_at

                return (
                  <TableRow key={brand.id} className={isDeleted ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {brand.picture && (
                          <img 
                            src={brand.picture} 
                            alt={brand.label}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        )}
                        <span className="font-medium">{brand.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {connectedPlatforms.map(platform => (
                          <Badge 
                            key={platform} 
                            variant="secondary"
                            className={`text-white ${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'}`}
                          >
                            {platform}
                          </Badge>
                        ))}
                        {connectedPlatforms.length === 0 && (
                          <span className="text-muted-foreground text-sm">Geen platforms</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(brand.last_synced_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isDeleted ? 'destructive' : 'success'}>
                        {isDeleted ? 'Verwijderd' : 'Actief'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Geen brands gevonden. Test eerst de verbinding en voer een synchronisatie uit.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Synchronisatie Logs</CardTitle>
          <CardDescription>
            Overzicht van recente synchronisaties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bron</TableHead>
                <TableHead>Resultaten</TableHead>
                <TableHead>Duur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.map((log) => {
                const duration = log.finished_at 
                  ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                  : null

                return (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.started_at)}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'success' ? 'success' : 'destructive'}>
                        {log.status === 'success' ? 'Succesvol' : 'Mislukt'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.source === 'manual' ? 'Handmatig' : 'Automatisch'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <div className="text-sm">
                          <span className="text-green-600">{log.created} nieuw</span>
                          {', '}
                          <span className="text-blue-600">{log.updated} bijgewerkt</span>
                          {log.marked_deleted > 0 && (
                            <>
                              {', '}
                              <span className="text-red-600">{log.marked_deleted} verwijderd</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-red-600 text-sm">
                          {log.error_message || 'Onbekende fout'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {duration !== null ? `${duration}s` : 'Lopend...'}
                    </TableCell>
                  </TableRow>
                )
              })}
              {syncLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nog geen synchronisaties uitgevoerd
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
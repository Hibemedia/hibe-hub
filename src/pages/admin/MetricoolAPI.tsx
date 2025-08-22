import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Loader2, CheckCircle, XCircle, RefreshCw, Clock, Users, Settings, Timer } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MetricoolCredentials {
  access_token: string
  user_id: string
}

interface MetricoolBrand {
  id: number
  userid: number | null
  owneruserid: number | null
  label: string | null
  url: string | null
  title: string | null
  description: string | null
  picture: string | null
  twitter: string | null
  facebook: string | null
  facebookpageid: string | null
  facebookgroup: string | null
  facebookgroupid: string | null
  instagram: string | null
  fbbusinessid: string | null
  googleplus: string | null
  linkedincompany: string | null
  facebookads: string | null
  adwords: string | null
  gmb: string | null
  youtube: string | null
  twitch: string | null
  tiktokads: string | null
  pinterest: string | null
  tiktok: string | null
  threads: string | null
  bluesky: string | null
  feedrss: string | null
  tiktokaccounttype: string | null
  instagramconnectiontype: string | null
  twitterpicture: string | null
  twittersubscriptiontype: string | null
  facebookpicture: string | null
  facebookgrouppicture: string | null
  instagrampicture: string | null
  linkedinpicture: string | null
  facebookadspicture: string | null
  facebookadsname: string | null
  pinterestpicture: string | null
  pinterestbusiness: string | null
  tiktokpicture: string | null
  tiktokbusinesstokenexpiration: string | null
  threadspicture: string | null
  threadsaccountname: string | null
  blueskypicture: string | null
  blueskyhandle: string | null
  fbuserid: string | null
  inuserid: string | null
  adwordsuserid: string | null
  adwordsaccountname: string | null
  gmbuserid: string | null
  gmbaccountname: string | null
  gmbaddress: string | null
  gmburl: string | null
  tiktokadsuserid: string | null
  linkedincompanypicture: string | null
  linkedincompanyname: string | null
  linkedintokenexpiration: string | null
  linkedinuserprofileurl: string | null
  youtubechannelname: string | null
  youtubechannelpicture: string | null
  twitchname: string | null
  twitchpicture: string | null
  twitchchannelid: string | null
  tiktokadsdisplayname: string | null
  tiktokadspicture: string | null
  tiktokuserprofileurl: string | null
  isshared: boolean | null
  ownerusername: string | null
  whitelabellink: string | null
  analyticmodewhitelabellink: string | null
  whitelabelalias: string | null
  hash: string | null
  version: string | null
  frontendversion: string | null
  role: string | null
  deletedate: string | null
  deleted: boolean | null
  joindate: string | null
  firstconnectiondate: string | null
  lastresolvedinboxmessagetimestamp: string | null
  lastreadinboxmessagetimestamp: string | null
  timezone: string | null
  availableconnectors: string | null
  brandrole: string | null
  iswhitelabel: boolean | null
  iswhitelabelonlyread: boolean | null
  engagementratio: number | null
  raw_data: any
  last_synced_at: string
  deleted_at: string | null
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

interface SyncSchedule {
  id: number
  interval_hours: number
  enabled: boolean
  last_run_at: string | null
  next_run_at: string | null
  created_at: string
  updated_at: string
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

  if (brand.facebookpageid || brand.facebook || brand.facebookgroupid || brand.facebookads) {
    platforms.push('Facebook')
  }
  if (brand.instagram || brand.instagrampicture || brand.instagramconnectiontype) {
    platforms.push('Instagram')
  }
  if (brand.tiktok || brand.tiktokads || brand.tiktokadsdisplayname || brand.tiktokadsuserid || brand.tiktokpicture) {
    platforms.push('TikTok')
  }
  if (brand.linkedincompany || brand.linkedincompanyname || brand.linkedinuserprofileurl || brand.linkedinpicture) {
    platforms.push('LinkedIn')
  }
  if (brand.youtube || brand.youtubechannelname || brand.youtubechannelpicture) {
    platforms.push('YouTube')
  }
  if (brand.pinterest || brand.pinterestbusiness || brand.pinterestpicture) {
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
  const [syncSchedule, setSyncSchedule] = useState<SyncSchedule | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [connectionMessage, setConnectionMessage] = useState('')
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  
  // Pagination state for sync logs
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  
  const { toast } = useToast()

  // Load existing credentials and data
  useEffect(() => {
    loadCredentials()
    loadBrands()
    loadSyncSchedule()
    loadSyncLogs()
  }, [])

  // Reload sync logs when pagination changes
  useEffect(() => {
    loadSyncLogs()
  }, [currentPage, itemsPerPage])

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
        const sortedBrands = (data as any[]).sort((a, b) => (a.label || '').localeCompare(b.label || ''))
        setBrands(sortedBrands)
      }
    } catch (error) {
      console.error('Error loading brands:', error)
    }
  }

  const loadSyncSchedule = async () => {
    try {
      const { data } = await supabase
        .from('metricool_sync_schedule')
        .select('*')
        .single()

      if (data) {
        setSyncSchedule(data as SyncSchedule)
      }
    } catch (error) {
      console.error('Error loading sync schedule:', error)
    }
  }

  const loadSyncLogs = async () => {
    try {
      // Get total count
      const { count } = await supabase
        .from('metricool_sync_logs')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Get paginated data
      const offset = (currentPage - 1) * itemsPerPage
      const { data } = await supabase
        .from('metricool_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1)

      if (data) {
        setSyncLogs(data as any)
      }
    } catch (error) {
      console.error('Error loading sync logs:', error)
    }
  }

  const saveScheduleSettings = async () => {
    if (!syncSchedule) return

    setIsSavingSchedule(true)

    try {
      // Calculate next run time if enabled
      let nextRunAt = null
      if (syncSchedule.enabled) {
        const now = new Date()
        nextRunAt = new Date(now.getTime() + syncSchedule.interval_hours * 60 * 60 * 1000)
      }

      const { error } = await supabase
        .from('metricool_sync_schedule')
        .update({
          interval_hours: syncSchedule.interval_hours,
          enabled: syncSchedule.enabled,
          next_run_at: nextRunAt?.toISOString() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', syncSchedule.id)

      if (error) throw error

      // Reload schedule to ensure state is up to date
      await loadSyncSchedule()

      toast({
        title: "Instellingen opgeslagen",
        description: syncSchedule.enabled 
          ? `Automatische synchronisatie ingesteld op elke ${syncSchedule.interval_hours} uur`
          : "Automatische synchronisatie uitgeschakeld"
      })
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const saveCredentials = async () => {
    if (!credentials.access_token || !credentials.user_id) {
      toast({
        title: "Fout",
        description: "Vul zowel Access Token als User ID in",
        variant: "destructive"
      })
      return
    }

    setIsSavingCredentials(true)

    try {
      const { error } = await supabase
        .from('metricool_credentials')
        .upsert({
          access_token: credentials.access_token,
          user_id: credentials.user_id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'singleton_check'
        })

      if (error) throw error

      // Reload credentials to ensure state is up to date
      await loadCredentials()

      toast({
        title: "Opgeslagen",
        description: "Metricool credentials zijn succesvol opgeslagen"
      })
    } catch (error: any) {
      toast({
        title: "Fout bij opslaan",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSavingCredentials(false)
    }
  }

  const testConnectionAndSync = async () => {
    if (!credentials.access_token || !credentials.user_id) {
      toast({
        title: "Fout",
        description: "Vul zowel Access Token als User ID in",
        variant: "destructive"
      })
      return
    }

    setIsSyncing(true)
    setConnectionStatus('idle')

    try {
      // First test connection
      const { data: testData, error: testError } = await supabase.functions.invoke('metricool-test-connection', {
        body: {
          accessToken: credentials.access_token,
          userId: credentials.user_id
        }
      })

      if (testError) throw testError

      if (!testData.success) {
        throw new Error(testData.error)
      }

      setConnectionStatus('success')
      setConnectionMessage(`Verbinding succesvol! ${testData.brandCount} brands gevonden.`)

      // Then sync brands
      const { data: syncData, error: syncError } = await supabase.functions.invoke('metricool-sync-brands', {
        body: { source: 'manual' }
      })

      if (syncError) throw syncError

      if (syncData.success) {
        toast({
          title: "Synchronisatie voltooid",
          description: `${syncData.created} aangemaakt, ${syncData.updated} bijgewerkt, ${syncData.marked_deleted} verwijderd`
        })
        
        // Reload data
        loadBrands()
        loadSyncLogs()
      } else {
        throw new Error(syncData.error)
      }
    } catch (error: any) {
      setConnectionStatus('error')
      setConnectionMessage(error.message || 'Synchronisatie mislukt')
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

  const [resyncingBrandId, setResyncingBrandId] = useState<number | null>(null)
  const resyncBrand = async (brandId: number) => {
    try {
      setResyncingBrandId(brandId)
      const { data, error } = await supabase.functions.invoke('metricool-sync-brands', {
        body: { source: 'manual_brand_resync', brand_id: brandId, force_full: true }
      })
      if (error) throw error
      toast({ title: 'Her-sync gestart', description: `Brand ${brandId}: ${data?.updated ?? 0} bijgewerkt` })
      await loadBrands()
    } catch (e: any) {
      toast({ title: 'Her-sync mislukt', description: e.message, variant: 'destructive' })
    } finally {
      setResyncingBrandId(null)
      loadSyncLogs()
    }
  }


  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Metricool API</h1>
        <p className="text-muted-foreground">
          Beheer de verbinding met Metricool en synchroniseer brands
        </p>
      </div>

      <div className="space-y-8">{/* Added space-y-8 for consistent spacing */}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuratie</CardTitle>
          <CardDescription>
            Stel de Metricool API credentials in voor synchronisatie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="flex gap-3">
            <Button 
              onClick={saveCredentials} 
              disabled={isSavingCredentials}
              variant="outline"
            >
              {isSavingCredentials && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Opslaan
            </Button>

            <Button 
              onClick={testConnectionAndSync} 
              disabled={isSyncing || !credentials.access_token || !credentials.user_id}
            >
              {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Synchroniseren
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

      {/* Automatic Synchronization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Automatische Synchronisatie
          </CardTitle>
          <CardDescription>
            Stel in wanneer brands automatisch opgehaald moeten worden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {syncSchedule && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="syncInterval">Synchronisatie interval</Label>
                  <Select 
                    value={syncSchedule.interval_hours.toString()} 
                    onValueChange={(value) => setSyncSchedule(prev => prev ? { ...prev, interval_hours: parseInt(value) } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Elke 12 uur</SelectItem>
                      <SelectItem value="24">Elke 24 uur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autoSyncEnabled">Automatische sync inschakelen</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoSyncEnabled"
                      checked={syncSchedule.enabled}
                      onCheckedChange={(checked) => setSyncSchedule(prev => prev ? { ...prev, enabled: checked } : null)}
                    />
                    <span className="text-sm text-muted-foreground">
                      {syncSchedule.enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Laatste synchronisatie</Label>
                  <p className="text-sm text-muted-foreground">
                    {syncSchedule.last_run_at ? formatDate(syncSchedule.last_run_at) : 'Nog niet uitgevoerd'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Volgende synchronisatie</Label>
                  <p className="text-sm text-muted-foreground">
                    {syncSchedule.enabled && syncSchedule.next_run_at 
                      ? formatDate(syncSchedule.next_run_at) 
                      : syncSchedule.enabled 
                        ? 'Wordt berekend na opslaan' 
                        : 'Uitgeschakeld'
                    }
                  </p>
                </div>
              </div>

              <Button 
                onClick={saveScheduleSettings} 
                disabled={isSavingSchedule}
                className="w-full md:w-auto"
              >
                {isSavingSchedule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Settings className="mr-2 h-4 w-4" />
                Schema instellingen opslaan
              </Button>
            </>
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
                <TableHead>Acties</TableHead>
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
                            className={`text-white hover:bg-transparent hover:text-inherit cursor-default ${PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || 'bg-gray-500'}`}
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
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => resyncBrand(brand.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          12m her-sync
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Geen brands gevonden. Voer eerst een synchronisatie uit.
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
        <CardContent className="space-y-4">
          {/* Pagination Controls Top */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="itemsPerPage" className="text-sm">Items per pagina:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1) // Reset to first page when changing items per page
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {totalCount > 0 ? (
                `Resultaten ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalCount)} van ${totalCount}`
              ) : (
                'Geen resultaten'
              )}
            </div>
          </div>

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
          
          {/* Pagination Controls Bottom */}
          {totalCount > 0 && (
            <div className="flex items-center justify-center">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(currentPage - 1)
                        }}
                      />
                    </PaginationItem>
                  )}
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                    .filter(page => {
                      // Show current page, first page, last page, and pages around current
                      const totalPages = Math.ceil(totalCount / itemsPerPage)
                      return page === 1 || 
                             page === totalPages || 
                             Math.abs(page - currentPage) <= 1
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore = index > 0 && page - array[index - 1] > 1
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsisBefore && (
                            <PaginationItem>
                              <span className="px-3 py-2">...</span>
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              href="#"
                              isActive={page === currentPage}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(page)
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        </div>
                      )
                    })}
                  
                  {currentPage < Math.ceil(totalCount / itemsPerPage) && (
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(currentPage + 1)
                        }}
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

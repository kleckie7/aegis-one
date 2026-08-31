import { Navigate, Route, Routes } from 'react-router'
import Layout from '@/components/Layout'
import AppShell from '@/components/app/AppShell'
import Landing from '@/pages/Landing'
import CommandCenter from '@/pages/app/CommandCenter'
import IotSecurity from '@/pages/app/domains/IotSecurity'
import InformationSecurity from '@/pages/app/domains/InformationSecurity'
import ApplicationSecurity from '@/pages/app/domains/ApplicationSecurity'
import Grc from '@/pages/app/domains/Grc'
import CloudSecurity from '@/pages/app/domains/CloudSecurity'
import VulnerabilityManagement from '@/pages/app/domains/VulnerabilityManagement'
import Soc from '@/pages/app/domains/Soc'
import DataSecurity from '@/pages/app/domains/DataSecurity'
import NetworkSecurity from '@/pages/app/domains/NetworkSecurity'
import EndpointSecurity from '@/pages/app/domains/EndpointSecurity'

export default function App() {
  return (
    <Routes>
      {/* Landing — fixed overlay nav; Layout owns the top offset */}
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      {/* Command suite — full-height app shell */}
      <Route path="/app" element={<AppShell />}>
        <Route index element={<CommandCenter />} />
        <Route path="iot-security" element={<IotSecurity />} />
        <Route path="information-security" element={<InformationSecurity />} />
        <Route path="application-security" element={<ApplicationSecurity />} />
        <Route path="grc" element={<Grc />} />
        <Route path="cloud-security" element={<CloudSecurity />} />
        <Route path="vulnerability-management" element={<VulnerabilityManagement />} />
        <Route path="soc" element={<Soc />} />
        <Route path="data-security" element={<DataSecurity />} />
        <Route path="network-security" element={<NetworkSecurity />} />
        <Route path="endpoint-security" element={<EndpointSecurity />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

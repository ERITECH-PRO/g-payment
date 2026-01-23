import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MONTHS_FR = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' TND'
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user is authenticated and admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Non autorisé')
    }

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roles?.role !== 'admin') {
      throw new Error('Accès refusé')
    }

    // Get salary ID from request
    const { salaryId } = await req.json()
    if (!salaryId) {
      throw new Error('ID salaire requis')
    }

    // Fetch salary with employee data
    const { data: salary, error: salaryError } = await supabase
      .from('salaries')
      .select(`
        *,
        employee:employees(*)
      `)
      .eq('id', salaryId)
      .single()

    if (salaryError || !salary) {
      throw new Error('Salaire non trouvé')
    }

    // Fetch company data
    const { data: company } = await supabase
      .from('company')
      .select('*')
      .limit(1)
      .maybeSingle()

    const employee = salary.employee
    const salaire = Number(salary.salaire)
    const prime = Number(salary.prime) || 0
    const total = salaire + prime

    // Generate simple text-based PDF (HTML to be converted)
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #e48f13;
    }
    .company-info h1 { 
      color: #e48f13; 
      font-size: 24px; 
      margin-bottom: 10px;
    }
    .company-info p { 
      color: #666; 
      font-size: 14px;
      line-height: 1.5;
    }
    .logo {
      max-width: 120px;
      max-height: 80px;
    }
    .title {
      text-align: center;
      margin: 30px 0;
    }
    .title h2 {
      color: #1a1a2e;
      font-size: 22px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .title p {
      color: #e48f13;
      font-size: 16px;
      margin-top: 8px;
      font-weight: bold;
    }
    .section {
      margin: 25px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .section h3 {
      color: #e48f13;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      color: #666;
      font-size: 13px;
      min-width: 120px;
    }
    .info-value {
      color: #333;
      font-size: 13px;
      font-weight: 500;
    }
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .salary-table th {
      background: #1a1a2e;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 13px;
    }
    .salary-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }
    .salary-table tr:last-child td {
      border-bottom: none;
    }
    .salary-table .amount {
      text-align: right;
      font-family: monospace;
    }
    .total-box {
      background: linear-gradient(135deg, #e48f13, #f5a623);
      color: white;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
      margin-top: 30px;
    }
    .total-box .label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.9;
    }
    .total-box .amount {
      font-size: 32px;
      font-weight: bold;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #666;
    }
    .signature {
      text-align: right;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      margin-top: 50px;
      margin-left: auto;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      ${company?.logo_url ? `<img src="${company.logo_url}" alt="Logo" class="logo" />` : ''}
      <h1>${company?.nom || 'Entreprise'}</h1>
      <p>${company?.adresse || ''}<br>${company?.ville || ''}</p>
      ${company?.cnss_employeur ? `<p>CNSS: ${company.cnss_employeur}</p>` : ''}
    </div>
  </div>

  <div class="title">
    <h2>Bulletin de Paie</h2>
    <p>${MONTHS_FR[salary.month]} ${salary.year}</p>
  </div>

  <div class="section">
    <h3>Informations Employé</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Code Employé:</span>
        <span class="info-value">${employee.code}</span>
      </div>
      <div class="info-item">
        <span class="info-label">CIN:</span>
        <span class="info-value">${employee.cin}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Nom & Prénom:</span>
        <span class="info-value">${employee.nom} ${employee.prenom}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type Contrat:</span>
        <span class="info-value">${employee.type_contrat}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Poste:</span>
        <span class="info-value">${employee.poste}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Service:</span>
        <span class="info-value">${employee.service || '-'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Date d'embauche:</span>
        <span class="info-value">${formatDate(employee.date_embauche)}</span>
      </div>
    </div>
  </div>

  <table class="salary-table">
    <thead>
      <tr>
        <th>Désignation</th>
        <th style="text-align: right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Salaire de base</td>
        <td class="amount">${formatCurrency(salaire)}</td>
      </tr>
      ${prime > 0 ? `
      <tr>
        <td>Prime</td>
        <td class="amount">${formatCurrency(prime)}</td>
      </tr>
      ` : ''}
      <tr style="font-weight: bold; background: #f0f0f0;">
        <td>Total Brut</td>
        <td class="amount">${formatCurrency(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="total-box">
    <div class="label">Net à Payer</div>
    <div class="amount">${formatCurrency(total)}</div>
  </div>

  <div class="footer">
    <div>
      <p>Document généré le ${formatDate(new Date().toISOString())}</p>
    </div>
    <div class="signature">
      <p>Signature et cachet</p>
      <div class="signature-line"></div>
    </div>
  </div>
</body>
</html>
`

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="bulletin-${employee.code}-${salary.year}-${String(salary.month).padStart(2, '0')}.html"`,
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    console.error('Error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

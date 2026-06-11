import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  console.log('Seeding data...')

  // Clear existing data (optional but good for a clean start)
  // await supabase.from('auctions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Create a user ID for demo
  const demoUserId = '00000000-0000-0000-0000-000000000000'

  // 1. Create a Live Auction
  const { data: liveAuction, error: liveError } = await supabase.from('auctions').insert({
    title: 'Leilão Vanguarda - Joias e Relógios de Luxo',
    description: 'Uma curadoria exclusiva de peças raras e históricas.',
    type: 'live',
    status: 'active',
    starts_at: new Date().toISOString(),
    created_by: demoUserId,
  }).select().single()

  if (liveError) {
    console.error('Error creating live auction:', liveError.message)
  } else {
    console.log('Live auction created:', liveAuction.id)
    
    // Add lots to live auction
    const lots = [
      {
        auction_id: liveAuction.id,
        title: 'Rolex Daytona Gold',
        description: 'Relógio em ouro 18k, estado impecável.',
        starting_price: 88000,
        current_highest_bid: 88000,
        lot_order: 1,
        status: 'active',
      },
      {
        auction_id: liveAuction.id,
        title: 'Colar de Diamantes Tiffany',
        description: 'Peça exclusiva com 5 quilates.',
        starting_price: 120000,
        current_highest_bid: 120000,
        lot_order: 2,
        status: 'pending',
      }
    ]
    
    const { data: lotsData, error: lotsError } = await supabase.from('lots').insert(lots).select()
    if (lotsError) console.error('Error creating lots:', lotsError.message)
    else {
      // Create live control
      await supabase.from('live_auction_control').insert({
        auction_id: liveAuction.id,
        current_lot_id: lotsData[0].id,
        is_running: true,
      })
    }
  }

  // 2. Create a Simultaneous Auction
  const { data: simAuction, error: simError } = await supabase.from('auctions').insert({
    title: 'Leilão Imobiliário - Litoral Catarinense',
    description: 'Oportunidades em apartamentos de alto padrão.',
    type: 'simultaneous',
    status: 'active',
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    created_by: demoUserId,
  }).select().single()

  if (simError) {
    console.error('Error creating simultaneous auction:', simError.message)
  } else {
    console.log('Simultaneous auction created:', simAuction.id)
    
    // Add lots to simultaneous auction
    const simLots = [
      {
        auction_id: simAuction.id,
        title: 'Cobertura Duplex Balneário Camboriú',
        description: 'Vista mar permanente, 4 suítes.',
        starting_price: 4250000,
        current_highest_bid: 4300000,
        lot_order: 1,
        status: 'active',
      },
      {
        auction_id: simAuction.id,
        title: 'Apartamento Garden Itapema',
        description: 'Próximo ao Meia Praia, área de lazer completa.',
        starting_price: 1500000,
        current_highest_bid: 1550000,
        lot_order: 2,
        status: 'active',
      }
    ]
    
    await supabase.from('lots').insert(simLots)
  }

  console.log('Seeding complete!')
}

seed()

import { NextResponse } from 'next/server'
import { getAssistantConfig } from '../../../../server/services/assistant-config'

export async function GET() {
  const config = await getAssistantConfig()

  return NextResponse.json(
    {
      assistantName: config.assistantName,
      iconStyle: config.iconStyle,
      accentColor: config.accentColor,
      greeting: config.greeting,
    },
    {
      headers: {
        'Cache-Control':
          'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}

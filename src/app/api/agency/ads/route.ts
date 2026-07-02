import { NextResponse } from "next/server";
import {
  AD_PLATFORMS, AD_CAMPAIGNS, AD_CREATIVES, WEEKLY_PERFORMANCE,
  getAdsKPIs, getTopPerformingCreatives, getUnderperformingCreatives,
  getCampaignByPlatform,
} from "@/lib/ads-data";

export async function GET() {
  return NextResponse.json({
    kpis: getAdsKPIs(),
    platforms: AD_PLATFORMS,
    campaigns: AD_CAMPAIGNS,
    creatives: AD_CREATIVES,
    topCreatives: getTopPerformingCreatives(5),
    underperformingCreatives: getUnderperformingCreatives(),
    weeklyPerformance: WEEKLY_PERFORMANCE,
    campaignByPlatform: getCampaignByPlatform(),
  });
}

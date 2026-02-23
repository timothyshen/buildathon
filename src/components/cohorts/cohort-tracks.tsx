import Image from "next/image";
import type { Track } from "@/types";
import type { CohortSponsorWithOrg } from "@/services/sponsors.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Trophy, ExternalLink } from "lucide-react";

interface CohortTracksProps {
  tracks: Track[];
  sponsors: CohortSponsorWithOrg[];
}

interface SponsorGroup {
  sponsor: CohortSponsorWithOrg;
  tracks: Track[];
}

export function CohortTracks({ tracks, sponsors }: CohortTracksProps) {
  if (tracks.length === 0) {
    return (
      <div className="py-6">
        <h2 className="text-xl font-semibold mb-6">Tracks</h2>
        <p className="text-muted-foreground">
          No tracks have been announced yet.
        </p>
      </div>
    );
  }

  // Group tracks by sponsor
  const sponsorGroups: SponsorGroup[] = [];
  const generalTracks: Track[] = [];

  const sponsorMap = new Map(sponsors.map((s) => [s.id, s]));

  for (const track of tracks) {
    if (track.sponsorOrgId && sponsorMap.has(track.sponsorOrgId)) {
      const existing = sponsorGroups.find(
        (g) => g.sponsor.id === track.sponsorOrgId
      );
      if (existing) {
        existing.tracks.push(track);
      } else {
        sponsorGroups.push({
          sponsor: sponsorMap.get(track.sponsorOrgId)!,
          tracks: [track],
        });
      }
    } else {
      generalTracks.push(track);
    }
  }

  // Sort sponsor groups by tier: platinum → gold → silver → bronze → community
  const tierOrder = ["platinum", "gold", "silver", "bronze", "community"];
  sponsorGroups.sort(
    (a, b) => tierOrder.indexOf(a.sponsor.tier) - tierOrder.indexOf(b.sponsor.tier)
  );

  // All accordion items open by default
  const defaultOpen = [
    ...(generalTracks.length > 0 ? ["general"] : []),
    ...sponsorGroups.map((g) => g.sponsor.id),
  ];

  return (
    <div className="py-6">
      <h2 className="text-xl font-semibold mb-6">Tracks</h2>

      <Accordion type="multiple" defaultValue={defaultOpen}>
        {/* General (non-sponsored) tracks first */}
        {generalTracks.length > 0 && (
          <AccordionItem value="general">
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-3 text-left">
                <span className="text-base font-semibold">General Tracks</span>
                <Badge variant="secondary" className="text-xs">
                  {generalTracks.length}{" "}
                  {generalTracks.length === 1 ? "track" : "tracks"}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generalTracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Sponsor groups sorted by tier */}
        {sponsorGroups.map((group) => (
          <AccordionItem key={group.sponsor.id} value={group.sponsor.id}>
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex items-center gap-3">
                {group.sponsor.logo && (
                  <div className="relative h-8 w-8 shrink-0">
                    <Image
                      unoptimized
                      src={group.sponsor.logo}
                      alt={group.sponsor.name}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 text-left">
                  <span className="text-base font-semibold">
                    {group.sponsor.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {group.tracks.length}{" "}
                    {group.tracks.length === 1 ? "track" : "tracks"}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Sponsor message */}
                {group.sponsor.sponsorMessage && (
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <RichTextDisplay
                      content={group.sponsor.sponsorMessage}
                      className="text-sm text-muted-foreground"
                    />
                    {group.sponsor.website && (
                      <a
                        href={group.sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Visit {group.sponsor.name}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Sponsor's tracks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.tracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{track.name}</CardTitle>
          {track.prizePool && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 shrink-0"
            >
              <Trophy className="h-3 w-3" />
              {track.prizePool}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {track.description && (
          <CardDescription className="text-sm">
            {track.description}
          </CardDescription>
        )}

        {track.requirements && track.requirements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Requirements</h4>
            <ul className="space-y-1">
              {track.requirements.map((requirement, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-primary mt-1">&#8226;</span>
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

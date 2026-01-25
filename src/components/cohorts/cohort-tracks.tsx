import { Track } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface CohortTracksProps {
  tracks: Track[];
}

export function CohortTracks({ tracks }: CohortTracksProps) {
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

  return (
    <div className="py-6">
      <h2 className="text-xl font-semibold mb-6">Tracks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tracks.map((track) => (
          <Card key={track.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{track.name}</CardTitle>
                  {track.sponsorName && (
                    <div className="flex items-center gap-2">
                      {track.sponsorLogo && (
                        <img
                          src={track.sponsorLogo}
                          alt={track.sponsorName}
                          className="h-5 w-5 object-contain"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        Sponsored by {track.sponsorName}
                      </span>
                    </div>
                  )}
                </div>
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
              {/* Description */}
              <CardDescription className="text-sm">
                {track.description}
              </CardDescription>

              {/* Requirements */}
              {track.requirements && track.requirements.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {track.requirements.map((requirement, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary mt-1">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

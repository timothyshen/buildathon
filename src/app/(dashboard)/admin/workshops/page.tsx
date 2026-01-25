"use client";

import { useState } from "react";
import { mockWorkshops } from "@/data/mock-data";
import { AdminNav } from "@/components/admin/admin-nav";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Pencil, Trash2, Play, FileText, GraduationCap } from "lucide-react";

export default function AdminWorkshopPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const categories = Array.from(new Set(mockWorkshops.map((w) => w.category)));

  return (
    <div className="space-y-6">
      <AdminNav />
      <Breadcrumb
        items={[
          { label: "Admin", href: "/dashboard" },
          { label: "Workshops" }
        ]}
        className="mb-4"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workshop Content</h1>
          <p className="mt-2 text-muted-foreground">
            Manage tutorials, videos, and learning resources
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Workshop Content</DialogTitle>
              <DialogDescription>
                Create a new tutorial or learning resource
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Workshop title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will learners gain from this content?"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basics">Basics</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input id="duration" placeholder="e.g., 30 min" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input id="videoUrl" type="url" placeholder="https://youtube.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleUrl">Article URL</Label>
                <Input id="articleUrl" type="url" placeholder="https://docs..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="partnerName">Partner Name</Label>
                  <Input id="partnerName" placeholder="Story Foundation" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerLogo">Partner Logo URL</Label>
                  <Input id="partnerLogo" type="url" placeholder="https://..." />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Add Content
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockWorkshops.length}</div>
          </CardContent>
        </Card>
        {categories.slice(0, 3).map((category) => (
          <Card key={category}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockWorkshops.filter((w) => w.category === category).length}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Table */}
      {mockWorkshops.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Workshops Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create workshops to help participants learn.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Content</CardTitle>
            <CardDescription>
              {mockWorkshops.length} workshop{mockWorkshops.length !== 1 ? "s" : ""} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWorkshops.map((workshop) => (
                    <TableRow key={workshop.id}>
                      <TableCell>
                        <div className="max-w-[280px]">
                          <p className="font-medium truncate">{workshop.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {workshop.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{workshop.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {workshop.partnerName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {workshop.duration || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {workshop.videoUrl && (
                            <Badge variant="secondary" className="gap-1">
                              <Play className="h-3 w-3" />
                              Video
                            </Badge>
                          )}
                          {workshop.articleUrl && (
                            <Badge variant="secondary" className="gap-1">
                              <FileText className="h-3 w-3" />
                              Article
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {workshop.publishedAt
                          ? new Date(workshop.publishedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

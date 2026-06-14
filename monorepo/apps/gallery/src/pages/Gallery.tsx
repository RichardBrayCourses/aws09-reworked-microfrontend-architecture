import Preview from "../components/Preview";
import { Button } from "@frontend/ui/components/ui/button";
import { Input } from "@frontend/ui/components/ui/input";
import { useAuth } from "@frontend/auth/context/AuthContext";
import { listPhotos, togglePhotoLike } from "@frontend/api-client/services/photosService";
import { PhotoData } from "@frontend/api-client";
import { ChartNoAxesColumn, Heart, Search } from "lucide-react";
import { useEffect, useState } from "react";

function transformer(
  photo: PhotoData,
  index: number,
  setSelectedPhoto: (photo: PhotoData | null) => void,
  isLoggedIn: boolean,
  onLike: (photo: PhotoData) => void,
) {
  return (
    <div
      key={index}
      className="mb-6 break-inside-avoid rounded-xl overflow-hidden group relative text-left"
    >
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => setSelectedPhoto(photo)}
      >
        <img
          src={index % 2 === 0 ? photo.small : photo.large}
          alt={photo.title}
          className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
        />
      </button>
      <Button
        asChild
        type="button"
        size="icon"
        variant="secondary"
        className="absolute left-2 top-2 size-8 opacity-90"
        aria-label={`View analytics for ${photo.title}`}
      >
        <a href={`/analytics/images/${encodeURIComponent(photo.id)}`}>
          <ChartNoAxesColumn className="size-4" />
        </a>
      </Button>
      {isLoggedIn && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute right-2 top-2 size-8 opacity-90"
          aria-label={photo.likedByCurrentUser ? "Unlike photo" : "Like photo"}
          onClick={() => onLike(photo)}
        >
          <Heart
            className="size-4"
            fill={photo.likedByCurrentUser ? "currentColor" : "none"}
          />
        </Button>
      )}
      <button
        type="button"
        className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 duration-700 text-left"
        onClick={() => setSelectedPhoto(photo)}
      >
        <div className="text-white text-sm font-semibold">{photo.title}</div>
        <div className="text-white/80 text-xs">{photo.description}</div>
        {photo.authorNickname && (
          <div className="text-white/80 text-xs">by {photo.authorNickname}</div>
        )}
      </button>
    </div>
  );
}

const noMatches = () => (
  <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
    No matches. Try a different search.
  </div>
);

const Gallery = () => {
  const { isLoggedIn } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [bucketPhotos, setBucketPhotos] = useState<PhotoData[] | null>(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadPhotos = async () => {
      try {
        const photos = await listPhotos(searchText);
        if (!cancelled) setBucketPhotos(photos);
      } catch {
        if (!cancelled) setBucketPhotos([]);
      }
    };

    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [searchText]);

  if (bucketPhotos === null) {
    return <div className="max-w-5xl mx-auto p-4 pt-0">Loading...</div>;
  }

  const handleLike = async (photo: PhotoData) => {
    try {
      const response = await togglePhotoLike(photo.id);
      setBucketPhotos((photos) =>
        photos?.map((item) =>
          item.id === photo.id
            ? { ...item, likedByCurrentUser: response.liked }
            : item,
        ) ?? null,
      );
    } catch {
      // The photos service remains the source of truth; a failed click leaves local state alone.
    }
  };

  const transformedImages = bucketPhotos.map((photo: PhotoData, index: number) =>
    transformer(
      photo,
      index,
      setSelectedPhoto,
      isLoggedIn,
      handleLike,
    ),
  );

  return (
    <div className="max-w-5xl mx-auto p-4 pt-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Gallery</h1>
          <p className="text-sm text-muted-foreground">
            Browse shared photos and open image analytics.
          </p>
        </div>
        <div className="relative sm:ml-auto sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search artwork"
            className="pl-9"
            placeholder="Search artwork"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </div>

      {!bucketPhotos.length && noMatches()}

      {!selectedPhoto && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-6">
          {transformedImages}
        </div>
      )}

      {selectedPhoto && (
        <Preview
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
        />
      )}
    </div>
  );
};

export default Gallery;

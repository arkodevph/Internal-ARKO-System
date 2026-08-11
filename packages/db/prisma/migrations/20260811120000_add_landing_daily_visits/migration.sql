CREATE TABLE "LandingVisitDaily" (
    "date" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LandingVisitDaily_pkey" PRIMARY KEY ("date")
);

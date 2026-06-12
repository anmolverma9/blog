import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { softwareService } from '@/modules/software';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'listings';
    const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
    const pricingModel = searchParams.get('pricingModel') || undefined;
    const search = searchParams.get('search') || undefined;

    if (type === 'categories') {
      const categories = await softwareService.getCategories();
      return NextResponse.json(categories);
    }

    if (type === 'reviews') {
      const softwareId = searchParams.get('softwareId');
      if (!softwareId) return NextResponse.json({ error: 'Software ID is required' }, { status: 400 });
      const reviews = await softwareService.getReviews(Number(softwareId));
      return NextResponse.json(reviews);
    }

    // Default: Listings
    const listings = await softwareService.getListings({
      categoryId,
      pricingModel,
      search,
    });
    return NextResponse.json(listings);
  } catch (err: any) {
    console.error('Software GET error:', err.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // Public review submission
    if (type === 'review') {
      const { software_id, user_name, rating, review_text, pros, cons } = body;
      if (!software_id || !user_name || !rating) {
        return NextResponse.json({ error: 'Software ID, username, and rating are required' }, { status: 400 });
      }
      const reviewId = await softwareService.addReview({
        software_id: Number(software_id),
        user_name,
        rating: Number(rating),
        review_text,
        pros: Array.isArray(pros) ? pros : [],
        cons: Array.isArray(cons) ? cons : [],
      });
      return NextResponse.json({ success: true, id: reviewId });
    }

    // Admin commands require session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'category') {
      const { name, slug, description } = body;
      if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
      }
      const catId = await softwareService.createCategory(name, slug, description);
      return NextResponse.json({ success: true, id: catId });
    }

    if (type === 'listing') {
      const { name, slug, tagline, description, logo_url, website_url, pricing_model, category_id } = body;
      if (!name || !slug || !description) {
        return NextResponse.json({ error: 'Name, slug, and description are required' }, { status: 400 });
      }
      const listingId = await softwareService.createListing({
        name,
        slug,
        tagline,
        description,
        logo_url,
        website_url,
        pricing_model,
        category_id: category_id ? Number(category_id) : null,
      });
      return NextResponse.json({ success: true, id: listingId });
    }

    return NextResponse.json({ error: 'Invalid operation type' }, { status: 400 });
  } catch (err: any) {
    console.error('Software POST error:', err.message);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'listing') {
      const { name, slug, tagline, description, logo_url, website_url, pricing_model, category_id } = body;
      await softwareService.updateListing(Number(id), {
        name,
        slug,
        tagline,
        description,
        logo_url,
        website_url,
        pricing_model,
        category_id: category_id ? Number(category_id) : undefined,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
  } catch (err: any) {
    console.error('Software PUT error:', err.message);
    return NextResponse.json({ error: 'Failed to update software listing' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'listing';
    const id = searchParams.get('id');
    const softwareId = searchParams.get('softwareId');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'review') {
      if (!softwareId) return NextResponse.json({ error: 'Software ID is required for review deletion' }, { status: 400 });
      await softwareService.deleteReview(Number(id), Number(softwareId));
      return NextResponse.json({ success: true });
    }

    // Default: Delete software listing
    await softwareService.deleteListing(Number(id));
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Software DELETE error:', err.message);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}

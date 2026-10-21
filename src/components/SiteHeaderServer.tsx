import { content } from '@/lib/content';
import { categoriesOf } from '@/lib/course-categories';
import { SiteHeader, type MenuCourse } from './SiteHeader';

/**
 * Loads the course list for the header's Courses mega menu and hands the (small,
 * serialisable) slice to the client header. Kept separate so `SiteHeader` stays a client
 * component without reaching into the content layer.
 */
export async function SiteHeaderServer() {
  const [courses, menu] = await Promise.all([content.listCourses(), content.getNavigation('header')]);
  const menuCourses: MenuCourse[] = courses.map((c) => ({
    slug: c.slug,
    title: c.shortTitle || c.title,
    level: c.level,
    duration: c.duration,
    featured: Boolean(c.featured),
    categories: categoriesOf(c),
  }));
  // Only a Published "Header menu" takes over; otherwise the menu from Page text stays as it was.
  return <SiteHeader menuCourses={menuCourses} navItems={menu?.items} />;
}

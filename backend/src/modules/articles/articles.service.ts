import articlesRepository from './articles.repository.js';

function generateSlug(text: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };
  let slug = text.toString();
  Object.keys(trMap).forEach(key => {
    slug = slug.replace(new RegExp(key, 'g'), trMap[key]);
  });
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

interface ArticleCreateData {
  title?: string;
  slug?: string;
  content?: string;
}

interface ArticleUpdateData {
  title?: string;
  content?: string;
}

class ArticlesService {
  async createArticle(data: ArticleCreateData) {
    let slug = data.slug ? generateSlug(data.slug) : generateSlug(data.title || '');
    if (!slug) slug = 'page';

    let uniqueSlug = slug;
    let counter = 1;
    while (await articlesRepository.getBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    return articlesRepository.create({
      title: data.title || 'Adsız Yazı',
      slug: uniqueSlug,
      content: data.content || '',
    });
  }

  async getArticleBySlug(slug: string) {
    return articlesRepository.getBySlug(slug);
  }

  async listArticles() {
    return articlesRepository.getAll();
  }

  async deleteArticle(id: number) {
    return articlesRepository.deleteById(id);
  }

  async updateArticle(id: number, data: ArticleUpdateData) {
    return articlesRepository.update(id, data);
  }
}

export default new ArticlesService();

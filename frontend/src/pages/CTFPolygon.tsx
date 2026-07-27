import Layout from '../components/Layout';

const CTFPolygon = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">CTF-полигон</h1>
        <p className="text-gray-600 mb-6">
          Здесь будут размещаться соревновательные задания по кибербезопасности в формате Capture The Flag.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left">
          <h2 className="font-semibold text-yellow-800 mb-2">В разработке</h2>
          <p className="text-yellow-700 text-sm">
            Функционал CTF-полигона находится в стадии разработки. Ожидайте анонсов.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default CTFPolygon;